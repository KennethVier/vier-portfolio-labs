package com.portfolio.running.service.impl;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portfolio.running.dto.*;
import com.portfolio.running.entity.*;
import com.portfolio.running.exception.ResourceNotFoundException;
import com.portfolio.running.mapper.RunningCoachMapper;
import com.portfolio.running.repository.*;
import com.portfolio.running.service.CoachPromptService;
import com.portfolio.running.service.OllamaCoachClient;
import com.portfolio.running.service.RunningCoachService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RunningCoachServiceImpl implements RunningCoachService {
    private final RunnerProfileRepository profileRepository;
    private final TrainingPlanRepository planRepository;
    private final TrainingSessionRepository sessionRepository;
    private final WorkoutLogRepository workoutLogRepository;
    private final CoachInsightRepository insightRepository;
    private final RunningCoachMapper mapper;
    private final OllamaCoachClient coachClient;
    private final CoachPromptService coachPromptService;

    @Override
    @Transactional
    public RunnerProfileDto saveProfile(RunnerProfileRequest request) {
        RunnerProfile profile = profileRepository.findByEmailIgnoreCase(request.email()).orElseGet(RunnerProfile::new);
        profile.setEmail(request.email().trim().toLowerCase());
        profile.setName(request.name().trim());
        profile.setGoal(request.goal());
        profile.setLevel(request.level());
        profile.setWeeklyAvailability(request.weeklyAvailability());
        profile.setRecentWeeklyDistanceKm(request.recentWeeklyDistanceKm());
        profile.setTypicalPace(request.typicalPace());
        profile.setPreferredRunDays(request.preferredRunDays());
        profile.setHealthNotes(request.healthNotes());
        return mapper.toProfileDto(profileRepository.save(profile));
    }

    @Override
    @Transactional(readOnly = true)
    public RunnerProfileDto getProfileByEmail(String email) {
        return mapper.toProfileDto(findProfile(email));
    }

    @Override
    @Transactional
    public TrainingPlanDto generatePlan(GeneratePlanRequest request) {
        RunnerProfile profile = findProfile(request.email());
        planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(profile).ifPresent(existing -> existing.setActivePlan(false));

        LocalDate start = request.startDate() == null ? LocalDate.now() : request.startDate();
        TrainingPlan plan = new TrainingPlan();
        plan.setRunner(profile);
        plan.setTitle(buildTitle(profile));
        plan.setStartDate(start);
        plan.setEndDate(start.plusWeeks(4).minusDays(1));

        buildWeeks(profile, plan, start);
        String aiSummary = coachClient.generatePlan(coachPromptService.buildPlanPrompt(profile, plan));
        plan.setAiGenerated(aiSummary != null);
        plan.setCoachSummary(aiSummary == null ? fallbackPlanSummary(profile) : aiSummary);
        return mapper.toPlanDto(planRepository.save(plan));
    }

    @Override
    @Transactional(readOnly = true)
    public TrainingPlanDto getCurrentPlan(String email) {
        RunnerProfile profile = findProfile(email);
        TrainingPlan plan = planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(profile)
                .orElseThrow(() -> new ResourceNotFoundException("No active training plan found."));
        return mapper.toPlanDto(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public TrainingSessionDto getSession(Long id) {
        return mapper.toSessionDto(findSession(id));
    }

    @Override
    @Transactional
    public WorkoutLogDto logWorkout(Long sessionId, WorkoutLogRequest request) {
        TrainingSession session = findSession(sessionId);
        WorkoutLog log = new WorkoutLog();
        log.setSession(session);
        log.setSource(request.source() == null ? WorkoutSource.MANUAL : request.source());
        log.setDistanceKm(request.distanceKm());
        log.setDurationMinutes(request.durationMinutes());
        log.setPace(request.pace());
        log.setPerceivedEffort(request.perceivedEffort());
        log.setFatigueLevel(request.fatigueLevel());
        log.setPainLevel(request.painLevel());
        log.setCompletionStatus(request.completionStatus() == null ? SessionStatus.COMPLETED : request.completionStatus());
        log.setNotes(request.notes());
        session.setStatus(log.getCompletionStatus());
        WorkoutLog savedLog = workoutLogRepository.save(log);
        CoachInsight insight = createInsight(session, savedLog);
        return mapper.toWorkoutLogDto(savedLog, insight);
    }

    @Override
    @Transactional
    public CoachInsightDto adjustNextSession(String email) {
        RunnerProfile profile = findProfile(email);
        TrainingSession next = sessionRepository
                .findFirstByWeekPlanRunnerEmailIgnoreCaseAndStatusAndScheduledDateGreaterThanEqualOrderByScheduledDateAsc(
                        email, SessionStatus.PLANNED, LocalDate.now())
                .orElse(null);
        CoachInsight insight = new CoachInsight();
        insight.setRunner(profile);
        insight.setSession(next);
        insight.setFeedback("StrideMate reviewed your recent training rhythm and kept the next step practical.");
        insight.setRecoveryGuidance("Keep the next run conversational unless your legs feel unusually heavy.");
        insight.setNextAdjustment(next == null ? "No planned session is waiting. Generate a fresh plan when you are ready." :
                "Next up: " + next.getTitle() + ". Stay within the planned effort range and stop early if pain rises.");
        insight.setSafetyNote(safetyNote(profile, null));
        return mapper.toInsightDto(insightRepository.save(insight));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CoachInsightDto> getInsights(String email) {
        return insightRepository.findByRunnerEmailIgnoreCaseOrderByCreatedAtDesc(email).stream().map(mapper::toInsightDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardDto getDashboard(String email) {
        RunnerProfile profile = findProfile(email);
        TrainingPlanDto plan = planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(profile).map(mapper::toPlanDto).orElse(null);
        TrainingSessionDto next = sessionRepository
                .findFirstByWeekPlanRunnerEmailIgnoreCaseAndStatusAndScheduledDateGreaterThanEqualOrderByScheduledDateAsc(
                        email, SessionStatus.PLANNED, LocalDate.now())
                .map(mapper::toSessionDto).orElse(null);
        List<WorkoutLog> logs = workoutLogRepository.findBySessionWeekPlanRunnerEmailIgnoreCaseOrderByCreatedAtDesc(email);
        double distance = logs.stream().filter(log -> log.getDistanceKm() != null).mapToDouble(WorkoutLog::getDistanceKm).sum();
        List<CoachInsightDto> insights = insightRepository.findTop8ByRunnerEmailIgnoreCaseOrderByCreatedAtDesc(email).stream().map(mapper::toInsightDto).toList();
        long planned = plan == null ? 0 : plan.weeks().stream().flatMap(week -> week.sessions().stream()).count();
        return new DashboardDto(mapper.toProfileDto(profile), plan, next, distance, logs.size(), planned,
                insights.isEmpty() ? null : insights.get(0), insights);
    }

    private RunnerProfile findProfile(String email) {
        return profileRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Runner profile not found."));
    }

    private TrainingSession findSession(Long id) {
        return sessionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Training session not found."));
    }

    private CoachInsight createInsight(TrainingSession session, WorkoutLog log) {
        RunnerProfile profile = session.getWeek().getPlan().getRunner();
        String ai = coachClient.generateFeedback(coachPromptService.buildWorkoutInsightPrompt(profile, session, log));
        CoachInsight insight = new CoachInsight();
        insight.setRunner(profile);
        insight.setSession(session);
        insight.setWorkoutLog(log);
        insight.setAiGenerated(ai != null);
        insight.setFeedback(ai == null ? fallbackFeedback(session, log) : ai);
        insight.setRecoveryGuidance(recoveryGuidance(log));
        insight.setNextAdjustment(nextAdjustment(session, log));
        insight.setSafetyNote(safetyNote(profile, log));
        return insightRepository.save(insight);
    }

    private void buildWeeks(RunnerProfile profile, TrainingPlan plan, LocalDate start) {
        double weekOneTarget = weekOneTarget(profile);
        double progressionRate = conservativeProfile(profile) ? 0.08 : 0.10;
        for (int weekNo = 1; weekNo <= 4; weekNo++) {
            TrainingWeek week = new TrainingWeek();
            week.setPlan(plan);
            week.setWeekNumber(weekNo);
            week.setFocus(List.of("Foundation", "Build", "Sharpen", "Confidence").get(weekNo - 1));
            week.setTargetDistanceKm(round(weekOneTarget * Math.pow(1 + progressionRate, weekNo - 1)));
            plan.getWeeks().add(week);
            addSessions(profile, week, start.plusWeeks(weekNo - 1), trainingDays(profile), weekNo);
        }
    }

    private void addSessions(RunnerProfile profile, TrainingWeek week, LocalDate weekStart, int days, int weekNo) {
        List<DayOfWeek> runDays = runDays(profile, days);
        List<Double> weights = distanceWeights(runDays.size());
        for (int index = 0; index < runDays.size(); index++) {
            SessionType type = sessionTypeFor(profile, weekNo, index, runDays.size());
            double distance = round(week.getTargetDistanceKm() * weights.get(index));
            TrainingSession session = new TrainingSession();
            session.setWeek(week);
            session.setScheduledDate(weekStart.with(runDays.get(index)));
            session.setType(type);
            session.setTitle(titleFor(type));
            session.setTargetDistanceKm(distance);
            session.setTargetMinutes((int) Math.round(distance * minutesPerKm(profile, type)));
            session.setIntensity(intensityFor(type));
            session.setCoachNotes(notesFor(type, profile));
            week.getSessions().add(session);
        }
    }

    private double weekOneTarget(RunnerProfile profile) {
        double recent = profile.getRecentWeeklyDistanceKm() == null ? 0 : profile.getRecentWeeklyDistanceKm();
        double minimum = profile.getLevel() == RunnerLevel.BEGINNER ? 6.0 : 8.0;
        return round(Math.max(minimum, recent));
    }

    private int trainingDays(RunnerProfile profile) {
        int available = profile.getWeeklyAvailability() == null ? 3 : profile.getWeeklyAvailability();
        if (profile.getLevel() == RunnerLevel.ADVANCED && !hasHealthNotes(profile)) {
            return Math.max(2, Math.min(5, available));
        }
        return Math.max(2, Math.min(4, available));
    }

    private List<DayOfWeek> runDays(RunnerProfile profile, int days) {
        List<DayOfWeek> parsed = parsePreferredDays(profile.getPreferredRunDays());
        List<DayOfWeek> source = parsed.isEmpty()
                ? new ArrayList<>(List.of(DayOfWeek.TUESDAY, DayOfWeek.THURSDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY))
                : parsed;
        List<DayOfWeek> selected = new ArrayList<>();
        for (DayOfWeek day : source) {
            if (!selected.contains(day)) {
                selected.add(day);
            }
            if (selected.size() == days) {
                break;
            }
        }
        for (DayOfWeek fallback : List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)) {
            if (selected.size() == days) {
                break;
            }
            if (!selected.contains(fallback)) {
                selected.add(fallback);
            }
        }
        selected.sort(Comparator.naturalOrder());
        return selected;
    }

    private List<DayOfWeek> parsePreferredDays(String preferredRunDays) {
        if (preferredRunDays == null || preferredRunDays.isBlank()) {
            return List.of();
        }
        List<DayOfWeek> days = new ArrayList<>();
        String normalized = preferredRunDays.toLowerCase();
        for (DayOfWeek day : DayOfWeek.values()) {
            String full = day.name().toLowerCase();
            String title = full.charAt(0) + full.substring(1).toLowerCase();
            if (normalized.contains(title.toLowerCase()) || normalized.contains(full.substring(0, 3))) {
                days.add(day);
            }
        }
        days.sort(Comparator.naturalOrder());
        return days;
    }

    private List<Double> distanceWeights(int days) {
        return switch (days) {
            case 2 -> List.of(0.42, 0.58);
            case 3 -> List.of(0.30, 0.30, 0.40);
            case 4 -> List.of(0.22, 0.22, 0.22, 0.34);
            default -> List.of(0.18, 0.18, 0.20, 0.18, 0.26);
        };
    }

    private SessionType sessionTypeFor(RunnerProfile profile, int weekNo, int index, int totalSessions) {
        if (index == totalSessions - 1) {
            return SessionType.LONG_RUN;
        }
        if (conservativeProfile(profile) || weekNo == 1) {
            return index == 1 && totalSessions >= 4 ? SessionType.RECOVERY : SessionType.EASY_RUN;
        }
        if (index == 1 && weekNo >= 3) {
            return SessionType.INTERVALS;
        }
        if (index == 1 && weekNo >= 2) {
            return SessionType.TEMPO;
        }
        return SessionType.EASY_RUN;
    }

    private boolean conservativeProfile(RunnerProfile profile) {
        return profile.getLevel() == RunnerLevel.BEGINNER || profile.getLevel() == RunnerLevel.RETURNING || hasHealthNotes(profile);
    }

    private String intensityFor(SessionType type) {
        return switch (type) {
            case INTERVALS, TEMPO -> "moderate";
            default -> "easy";
        };
    }

    private double minutesPerKm(RunnerProfile profile, SessionType type) {
        double base = profile.getLevel() == RunnerLevel.BEGINNER ? 9.0 : 8.0;
        if (type == SessionType.LONG_RUN || type == SessionType.RECOVERY) {
            return base + 0.5;
        }
        if (type == SessionType.INTERVALS || type == SessionType.TEMPO) {
            return Math.max(6.0, base - 1.0);
        }
        return base;
    }
    private String titleFor(SessionType type) {
        return switch (type) {
            case LONG_RUN -> "Steady long run";
            case INTERVALS -> "Controlled interval session";
            case TEMPO -> "Comfortably hard tempo";
            case RECOVERY -> "Recovery jog";
            case REST -> "Rest day";
            case CROSS_TRAINING -> "Low-impact cross training";
            default -> "Easy aerobic run";
        };
    }

    private String notesFor(SessionType type, RunnerProfile profile) {
        String purpose = switch (type) {
            case LONG_RUN -> "Build endurance with a steady, controlled longer effort.";
            case RECOVERY -> "Keep movement gentle while supporting recovery and consistency.";
            case TEMPO -> "Practice a controlled, comfortably hard rhythm without racing.";
            case INTERVALS -> "Build speed carefully with smooth repeats and full control.";
            default -> "Build aerobic consistency without chasing speed.";
        };
        String effort = switch (type) {
            case TEMPO -> "Comfortably hard, but still controlled.";
            case INTERVALS -> "Moderate on the repeats; stop if form fades.";
            default -> "Conversational and easy.";
        };
        String caution = hasHealthNotes(profile)
                ? "Respect your health notes and stop or switch to walking if discomfort increases."
                : "Stop if pain, dizziness, chest discomfort, or unusual symptoms appear.";
        return "Warmup: 5 minutes brisk walk or very easy jog. "
                + "Purpose: " + purpose + " "
                + "Effort: " + effort + " "
                + "Cooldown: 5 minutes easy walk. "
                + "Caution: " + caution;
    }
    private String buildTitle(RunnerProfile profile) {
        return "4-week " + profile.getGoal().name().replace('_', ' ').toLowerCase() + " plan";
    }

    private String fallbackPlanSummary(RunnerProfile profile) {
        return "StrideMate built a conservative 4-week plan around your goal, current level, weekly availability, and health notes. The focus is consistency first, then controlled progression.";
    }

    private String fallbackFeedback(TrainingSession session, WorkoutLog log) {
        if (log.getPainLevel() != null && log.getPainLevel() >= 5) {
            return "You logged meaningful discomfort, so the priority is recovery and caution before adding more load.";
        }
        if (log.getPerceivedEffort() != null && log.getPerceivedEffort() >= 8) {
            return "That session landed harder than planned. Treat it as useful feedback and keep the next run easier.";
        }
        return "Good training signal. You completed the session with enough information for StrideMate to keep the plan calibrated.";
    }

    private String recoveryGuidance(WorkoutLog log) {
        if ((log.getFatigueLevel() != null && log.getFatigueLevel() >= 7) || (log.getPainLevel() != null && log.getPainLevel() >= 4)) {
            return "Prioritize sleep, hydration, and an easy day. Avoid hard running until fatigue and discomfort settle.";
        }
        return "Recover normally with light movement and keep the next session easy if your legs feel heavy.";
    }

    private String nextAdjustment(TrainingSession session, WorkoutLog log) {
        if (log.getCompletionStatus() == SessionStatus.SKIPPED) {
            return "Do not cram the missed workout. Resume with the next planned easy session.";
        }
        if (log.getPainLevel() != null && log.getPainLevel() >= 5) {
            return "Replace the next hard effort with an easy walk-run or rest day if pain persists.";
        }
        return "Continue with the next planned session, keeping effort within the target range.";
    }

    private String safetyNote(RunnerProfile profile, WorkoutLog log) {
        if (hasHealthNotes(profile) || (log != null && log.getPainLevel() != null && log.getPainLevel() >= 5)) {
            return "This is coaching guidance, not medical advice. If symptoms are sharp, unusual, or persistent, pause and consult a qualified professional.";
        }
        return "Listen to your body and stop if pain, dizziness, chest discomfort, or unusual symptoms appear.";
    }

    private boolean hasHealthNotes(RunnerProfile profile) {
        return profile.getHealthNotes() != null && !profile.getHealthNotes().isBlank();
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
