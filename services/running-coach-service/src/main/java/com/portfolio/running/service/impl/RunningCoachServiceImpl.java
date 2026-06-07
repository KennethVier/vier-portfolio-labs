package com.portfolio.running.service.impl;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.running.dto.*;
import com.portfolio.running.entity.*;
import com.portfolio.running.exception.ResourceNotFoundException;
import com.portfolio.running.mapper.RunningCoachMapper;
import com.portfolio.running.repository.*;
import com.portfolio.running.service.CoachPromptService;
import com.portfolio.running.service.OllamaCoachClient;
import com.portfolio.running.service.RunningCoachService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RunningCoachServiceImpl implements RunningCoachService {
    private static final ObjectMapper JSON = new ObjectMapper();

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
        String goalText = normalizedGoalText(request);
        profile.setEmail(request.email().trim().toLowerCase());
        profile.setName(request.name().trim());
        profile.setGoalText(goalText);
        profile.setGoal(request.goal() == null ? classifyGoal(goalText) : request.goal());
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
        log.info("StrideMate plan generation requested email={} startDate={} raceDate={}",
                request.email(), request.startDate(), request.raceDate());
        RunnerProfile profile = findProfile(request.email());
        planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(profile).ifPresent(existing -> existing.setActivePlan(false));

        LocalDate start = request.startDate() == null ? LocalDate.now() : request.startDate();
        LocalDate raceDate = request.raceDate();
        if (raceDate != null && raceDate.isBefore(start)) {
            log.warn("StrideMate plan generation rejected email={} startDate={} raceDate={} reason=raceDateBeforeStartDate",
                    profile.getEmail(), start, raceDate);
            throw new IllegalArgumentException("Race date must be on or after the training start date.");
        }
        log.info("StrideMate profile loaded email={} level={} weeklyAvailability={} preferredDays={} recentWeeklyKm={} hasHealthNotes={}",
                profile.getEmail(), profile.getLevel(), profile.getWeeklyAvailability(), profile.getPreferredRunDays(),
                profile.getRecentWeeklyDistanceKm(), hasHealthNotes(profile));

        TrainingPlan plan = new TrainingPlan();
        plan.setRunner(profile);
        plan.setTitle(buildTitle(profile));
        plan.setStartDate(start);
        plan.setRaceDate(raceDate);
        plan.setPlanType(raceDate == null ? PlanType.STANDARD_4_WEEK : PlanType.RACE_DATE_BASED);
        buildWeeks(profile, plan, start, raceDate);
        plan.setRaceStrategy(raceStrategyFor(profile, plan));
        log.info("StrideMate backend schedule built type={} weeks={} sessions={} start={} end={} raceDate={} selectedRunDays={}",
                plan.getPlanType(), plan.getWeeks().size(), sessionCount(plan), plan.getStartDate(), plan.getEndDate(),
                plan.getRaceDate(), runDays(profile, trainingDays(profile)));

        String prompt = coachPromptService.buildPlanPrompt(profile, plan);
        log.info("StrideMate AI plan enrichment request prepared model={} promptChars={} protectedSchedule=true",
                coachClient.planModelName(), prompt.length());
        long aiStartedAt = System.nanoTime();
        String aiResponse = coachClient.generatePlan(prompt);
        long aiElapsedMs = (System.nanoTime() - aiStartedAt) / 1_000_000;
        boolean appliedAi = applyAiPlan(aiResponse, plan);
        log.info("StrideMate AI plan enrichment result applied={} responseChars={} elapsedMs={}",
                appliedAi, aiResponse == null ? 0 : aiResponse.length(), aiElapsedMs);
        plan.setAiGenerated(appliedAi);
        if (!appliedAi) {
            plan.setCoachSummary(fallbackPlanSummary(profile));
            log.warn("StrideMate AI plan enrichment fallback used email={} reason=missingOrInvalidAiResponse", profile.getEmail());
        }
        TrainingPlan saved = planRepository.save(plan);
        log.info("StrideMate plan generation completed planId={} aiGenerated={} weeks={} sessions={}",
                saved.getId(), saved.isAiGenerated(), saved.getWeeks().size(), sessionCount(saved));
        return mapper.toPlanDto(saved);
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
        TrainingPlan activePlan = planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(profile).orElse(null);
        TrainingSession next = nextPlannedSession(activePlan, LocalDate.now()).orElse(null);
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
        TrainingPlan activePlan = planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(profile).orElse(null);
        TrainingPlanDto plan = activePlan == null ? null : mapper.toPlanDto(activePlan);
        TrainingSessionDto next = nextPlannedSession(activePlan, LocalDate.now()).map(mapper::toSessionDto).orElse(null);
        List<WorkoutLog> logs = workoutLogRepository.findBySessionWeekPlanRunnerEmailIgnoreCaseOrderByCreatedAtDesc(email);
        double distance = logs.stream().filter(log -> log.getDistanceKm() != null).mapToDouble(WorkoutLog::getDistanceKm).sum();
        List<CoachInsightDto> insights = insightRepository.findTop8ByRunnerEmailIgnoreCaseOrderByCreatedAtDesc(email).stream().map(mapper::toInsightDto).toList();
        long planned = plan == null ? 0 : plan.weeks().stream().flatMap(week -> week.sessions().stream()).count();
        return new DashboardDto(mapper.toProfileDto(profile), plan, next, distance, logs.size(), planned,
                insights.isEmpty() ? null : insights.get(0), insights);
    }

    private Optional<TrainingSession> nextPlannedSession(TrainingPlan plan, LocalDate fromDate) {
        if (plan == null) {
            return Optional.empty();
        }
        return plan.getWeeks().stream()
                .flatMap(week -> week.getSessions().stream())
                .filter(session -> session.getStatus() == SessionStatus.PLANNED)
                .filter(session -> session.getScheduledDate() != null && !session.getScheduledDate().isBefore(fromDate))
                .sorted(Comparator.comparing(TrainingSession::getScheduledDate))
                .findFirst();
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

    private void buildWeeks(RunnerProfile profile, TrainingPlan plan, LocalDate start, LocalDate raceDate) {
        if (raceDate == null) {
            buildStandardWeeks(profile, plan, start);
            return;
        }
        buildRaceDateWeeks(profile, plan, start, raceDate);
    }

    private void buildStandardWeeks(RunnerProfile profile, TrainingPlan plan, LocalDate start) {
        double weekOneTarget = weekOneTarget(profile);
        double progressionRate = conservativeProfile(profile) ? 0.08 : 0.10;
        int days = trainingDays(profile);
        for (int weekNo = 1; weekNo <= 4; weekNo++) {
            TrainingWeek week = newWeek(plan, weekNo, List.of("Foundation", "Build", "Sharpen", "Confidence").get(weekNo - 1));
            week.setTargetDistanceKm(round(weekOneTarget * Math.pow(1 + progressionRate, weekNo - 1)));
            LocalDate weekStart = start.plusWeeks(weekNo - 1);
            addTrainingSessions(profile, week, weekStart, weekStart.plusDays(6), days, weekNo);
        }
        plan.setEndDate(start.plusWeeks(4).minusDays(1));
    }

    private void buildRaceDateWeeks(RunnerProfile profile, TrainingPlan plan, LocalDate start, LocalDate raceDate) {
        long raceWindowDays = ChronoUnit.DAYS.between(start, raceDate) + 1;
        int trainingWeeks = Math.max(1, (int) Math.ceil(raceWindowDays / 7.0));
        double weekOneTarget = weekOneTarget(profile);
        double progressionRate = conservativeProfile(profile) ? 0.08 : 0.10;
        int days = trainingDays(profile);

        for (int weekNo = 1; weekNo <= trainingWeeks; weekNo++) {
            boolean raceWeek = weekNo == trainingWeeks;
            LocalDate weekStart = start.plusWeeks(weekNo - 1);
            TrainingWeek week = newWeek(plan, weekNo, raceWeek ? "Race week" : raceFocus(weekNo, trainingWeeks));
            double target = round(weekOneTarget * Math.pow(1 + progressionRate, Math.max(0, weekNo - 1)));
            if (raceWeek) {
                addRaceWeekSessions(profile, week, weekStart, raceDate, days, target);
            } else {
                week.setTargetDistanceKm(target);
                addTrainingSessions(profile, week, weekStart, weekStart.plusDays(6), days, weekNo);
            }
        }

        TrainingWeek recoveryWeek = newWeek(plan, trainingWeeks + 1, "Post-race recovery");
        addRecoveryWeekSessions(profile, recoveryWeek, raceDate.plusDays(1), days);
        plan.setEndDate(raceDate.plusDays(7));
    }

    private TrainingWeek newWeek(TrainingPlan plan, int weekNo, String focus) {
        TrainingWeek week = new TrainingWeek();
        week.setPlan(plan);
        week.setWeekNumber(weekNo);
        week.setFocus(focus);
        plan.getWeeks().add(week);
        return week;
    }

    private String raceFocus(int weekNo, int trainingWeeks) {
        if (trainingWeeks <= 2) {
            return "Race preparation";
        }
        int baseEnd = Math.max(1, trainingWeeks / 3);
        if (weekNo <= baseEnd) {
            return "Base building";
        }
        if (weekNo < trainingWeeks - 3) {
            return "Controlled build";
        }
        if (weekNo < trainingWeeks - 1) {
            return "Sharpen";
        }
        return "Taper setup";
    }
    private void addTrainingSessions(RunnerProfile profile, TrainingWeek week, LocalDate windowStart, LocalDate windowEnd, int days, int weekNo) {
        List<LocalDate> dates = runDates(profile, days, windowStart, windowEnd);
        List<Double> distances = sessionDistances(week.getTargetDistanceKm(), dates.size());
        for (int index = 0; index < dates.size(); index++) {
            SessionType type = sessionTypeFor(profile, weekNo, index, dates.size());
            addSession(profile, week, dates.get(index), type, distances.get(index));
        }
    }

    private void addRaceWeekSessions(RunnerProfile profile, TrainingWeek week, LocalDate weekStart, LocalDate raceDate, int days, double plannedTarget) {
        double raceDistance = raceDistanceKm(profile);
        List<LocalDate> prepDates = raceDate.isAfter(weekStart)
                ? runDates(profile, Math.max(1, days - 1), weekStart, raceDate.minusDays(1))
                : List.of();
        double prepTarget = Math.max(0, round(Math.min(plannedTarget * 0.55, Math.max(0, plannedTarget - raceDistance))));
        List<Double> prepDistances = sessionDistances(prepTarget, prepDates.size());
        for (int index = 0; index < prepDates.size(); index++) {
            SessionType type = index == prepDates.size() - 1 ? SessionType.RECOVERY : SessionType.EASY_RUN;
            addSession(profile, week, prepDates.get(index), type, prepDistances.get(index));
        }
        addSession(profile, week, raceDate, SessionType.RACE_DAY, raceDistance);
        week.setTargetDistanceKm(round(week.getSessions().stream()
                .filter(session -> session.getTargetDistanceKm() != null)
                .mapToDouble(TrainingSession::getTargetDistanceKm)
                .sum()));
    }

    private void addRecoveryWeekSessions(RunnerProfile profile, TrainingWeek week, LocalDate recoveryStart, int trainingDays) {
        int days = Math.max(1, Math.min(3, trainingDays));
        List<LocalDate> dates = runDates(profile, days, recoveryStart, recoveryStart.plusDays(6));
        double target = round(Math.max(3.0, raceDistanceKm(profile) * 0.45));
        week.setTargetDistanceKm(target);
        List<Double> distances = sessionDistances(target, dates.size());
        for (int index = 0; index < dates.size(); index++) {
            addSession(profile, week, dates.get(index), SessionType.RECOVERY, distances.get(index));
        }
    }

    private void addSession(RunnerProfile profile, TrainingWeek week, LocalDate date, SessionType type, double distance) {
        TrainingSession session = new TrainingSession();
        session.setWeek(week);
        session.setScheduledDate(date);
        session.setType(type);
        session.setTitle(titleFor(type));
        session.setTargetDistanceKm(distance);
        session.setTargetMinutes(type == SessionType.RACE_DAY ? null : (int) Math.round(distance * minutesPerKm(profile, type)));
        session.setIntensity(intensityFor(type));
        session.setMainWorkout(mainWorkoutFor(type, distance));
        session.setCoachNotes(notesFor(type, profile));
        week.getSessions().add(session);
    }

    private List<LocalDate> runDates(RunnerProfile profile, int days, LocalDate windowStart, LocalDate windowEnd) {
        if (days <= 0 || windowEnd.isBefore(windowStart)) {
            return List.of();
        }
        List<DayOfWeek> preferredDays = runDays(profile, Math.min(days, 7));
        List<LocalDate> candidates = new ArrayList<>();
        for (LocalDate date = windowStart; !date.isAfter(windowEnd); date = date.plusDays(1)) {
            if (preferredDays.contains(date.getDayOfWeek())) {
                candidates.add(date);
            }
        }
        if (parsePreferredDays(profile.getPreferredRunDays()).isEmpty()) {
            for (LocalDate date = windowStart; candidates.size() < days && !date.isAfter(windowEnd); date = date.plusDays(1)) {
                if (!candidates.contains(date)) {
                    candidates.add(date);
                }
            }
        }
        List<LocalDate> selected = bestSpacedDates(candidates, Math.min(days, candidates.size()));
        selected.sort(Comparator.naturalOrder());
        return selected;
    }

    private List<LocalDate> bestSpacedDates(List<LocalDate> candidates, int days) {
        if (days <= 0 || candidates.isEmpty()) {
            return List.of();
        }
        List<List<LocalDate>> combinations = new ArrayList<>();
        combineDates(candidates, days, 0, new ArrayList<>(), combinations);
        return combinations.stream()
                .max(Comparator.comparingInt(this::dateSpacingScore))
                .orElse(candidates.stream().limit(days).toList());
    }

    private void combineDates(List<LocalDate> source, int size, int index, List<LocalDate> current, List<List<LocalDate>> result) {
        if (current.size() == size) {
            result.add(new ArrayList<>(current));
            return;
        }
        for (int i = index; i < source.size(); i++) {
            current.add(source.get(i));
            combineDates(source, size, i + 1, current, result);
            current.remove(current.size() - 1);
        }
    }

    private int dateSpacingScore(List<LocalDate> dates) {
        List<LocalDate> sorted = dates.stream().sorted().toList();
        int score = 0;
        for (int i = 1; i < sorted.size(); i++) {
            long gap = ChronoUnit.DAYS.between(sorted.get(i - 1), sorted.get(i));
            score += Math.min(gap, 3) * 10;
            if (gap == 1) {
                score -= 30;
            }
        }
        return score;
    }

    private List<Double> sessionDistances(double weeklyTarget, int days) {
        List<Double> weights = distanceWeights(days);
        List<Double> distances = new ArrayList<>();
        double runningSum = 0;
        for (int index = 0; index < weights.size(); index++) {
            double distance = index == weights.size() - 1 ? round(weeklyTarget - runningSum) : round(weeklyTarget * weights.get(index));
            distances.add(distance);
            runningSum = round(runningSum + distance);
        }
        return distances;
    }

    private double weekOneTarget(RunnerProfile profile) {
        double recent = profile.getRecentWeeklyDistanceKm() == null ? 0 : profile.getRecentWeeklyDistanceKm();
        double minimum = profile.getLevel() == RunnerLevel.BEGINNER ? 6.0 : 8.0;
        double target = Math.max(minimum, recent);
        if (hasHealthNotes(profile) && recent > minimum) {
            target = Math.max(minimum, recent * 0.95);
        }
        return round(target);
    }

    private int trainingDays(RunnerProfile profile) {
        List<DayOfWeek> preferred = parsePreferredDays(profile.getPreferredRunDays());
        if (!preferred.isEmpty()) {
            return preferred.size();
        }
        int available = profile.getWeeklyAvailability() == null ? 3 : profile.getWeeklyAvailability();
        if (profile.getLevel() == RunnerLevel.ADVANCED && !hasHealthNotes(profile)) {
            return Math.max(2, Math.min(5, available));
        }
        return Math.max(2, Math.min(4, available));
    }

    private List<DayOfWeek> runDays(RunnerProfile profile, int days) {
        List<DayOfWeek> parsed = parsePreferredDays(profile.getPreferredRunDays());
        if (!parsed.isEmpty()) {
            return parsed;
        }
        List<DayOfWeek> candidates = new ArrayList<>(parsed.isEmpty()
                ? List.of(DayOfWeek.TUESDAY, DayOfWeek.THURSDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)
                : parsed);
        for (DayOfWeek fallback : List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)) {
            if (!candidates.contains(fallback)) {
                candidates.add(fallback);
            }
        }
        List<DayOfWeek> selected = bestSpacedSubset(candidates, days);
        selected.sort(Comparator.naturalOrder());
        return selected;
    }

    private List<DayOfWeek> bestSpacedSubset(List<DayOfWeek> candidates, int days) {
        List<List<DayOfWeek>> combinations = new ArrayList<>();
        combine(candidates, days, 0, new ArrayList<>(), combinations);
        return combinations.stream()
                .max(Comparator.comparingInt(this::spacingScore))
                .orElse(candidates.stream().limit(days).toList());
    }

    private void combine(List<DayOfWeek> source, int size, int index, List<DayOfWeek> current, List<List<DayOfWeek>> result) {
        if (current.size() == size) {
            result.add(new ArrayList<>(current));
            return;
        }
        for (int i = index; i < source.size(); i++) {
            current.add(source.get(i));
            combine(source, size, i + 1, current, result);
            current.remove(current.size() - 1);
        }
    }

    private int spacingScore(List<DayOfWeek> days) {
        List<Integer> values = days.stream().map(DayOfWeek::getValue).sorted().toList();
        int score = 0;
        for (int i = 1; i < values.size(); i++) {
            int gap = values.get(i) - values.get(i - 1);
            score += Math.min(gap, 3) * 10;
            if (gap == 1) {
                score -= 30;
            }
        }
        return score;
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
        if (weekNo == 1 || totalSessions < 3) {
            return index == 1 && totalSessions >= 4 ? SessionType.RECOVERY : SessionType.EASY_RUN;
        }
        if (index != qualitySessionIndex(totalSessions)) {
            return index == 1 && totalSessions >= 4 ? SessionType.RECOVERY : SessionType.EASY_RUN;
        }
        if (profile.getLevel() == RunnerLevel.BEGINNER || profile.getLevel() == RunnerLevel.RETURNING || hasHealthNotes(profile)) {
            return weekNo >= 3 ? SessionType.FARTLEK : SessionType.EASY_RUN;
        }
        if (profile.getLevel() == RunnerLevel.ADVANCED && weekNo >= 4) {
            return SessionType.INTERVALS;
        }
        return SessionType.TEMPO;
    }

    private int qualitySessionIndex(int totalSessions) {
        return Math.min(1, Math.max(0, totalSessions - 2));
    }

    private int sessionCount(TrainingPlan plan) {
        return plan.getWeeks().stream().mapToInt(week -> week.getSessions().size()).sum();
    }

    private boolean applyAiPlan(String aiResponse, TrainingPlan plan) {
        Optional<AiPlanResponse> parsed = parseAiPlan(aiResponse);
        if (parsed.isEmpty() || !validAiPlan(parsed.get(), plan)) {
            return false;
        }
        AiPlanResponse aiPlan = parsed.get();
        boolean applied = false;
        if (!blank(aiPlan.planTitle())) {
            plan.setTitle(clean(aiPlan.planTitle(), plan.getTitle(), 120));
            applied = true;
        }
        if (!blank(aiPlan.coachSummary())) {
            plan.setCoachSummary(clean(aiPlan.coachSummary(), fallbackPlanSummary(plan.getRunner()), 1600));
            applied = true;
        }
        for (TrainingWeek week : orderedWeeks(plan)) {
            Optional<AiWeek> maybeAiWeek = aiPlan.weeks().stream().filter(item -> item.weekNumber() == week.getWeekNumber()).findFirst();
            if (maybeAiWeek.isEmpty()) {
                continue;
            }
            AiWeek aiWeek = maybeAiWeek.get();
            if (!blank(aiWeek.focus())) {
                week.setFocus(clean(aiWeek.focus(), week.getFocus(), 80));
                applied = true;
            }
            List<TrainingSession> sessions = orderedSessions(week);
            for (int index = 0; index < sessions.size(); index++) {
                int sessionIndex = index + 1;
                TrainingSession session = sessions.get(index);
                Optional<AiSession> maybeAiSession = aiWeek.sessions().stream()
                        .filter(item -> item.sessionIndex() == sessionIndex)
                        .findFirst();
                if (maybeAiSession.isEmpty()) {
                    continue;
                }
                AiSession aiSession = maybeAiSession.get();
                if (!blank(aiSession.title())) {
                    session.setTitle(clean(aiSession.title(), session.getTitle(), 100));
                    applied = true;
                }
                if (!blank(aiSession.mainWorkout())) {
                    session.setMainWorkout(clean(aiSession.mainWorkout(), session.getMainWorkout(), 700));
                    applied = true;
                }
                session.setCoachNotes(coachNotesFrom(aiSession, session, plan.getRunner()));
                applied = true;
            }
        }
        return applied;
    }

    private Optional<AiPlanResponse> parseAiPlan(String aiResponse) {
        String cleaned = extractJsonObject(aiResponse);
        if (cleaned == null) {
            return Optional.empty();
        }
        try {
            JsonNode root = JSON.readTree(cleaned);
            List<AiWeek> weeks = root.has("sessionGuidance") ? parseFlatAiWeeks(root) : parseNestedAiWeeks(root);
            return Optional.of(new AiPlanResponse(textValue(root, "planTitle", "title"), textValue(root, "coachSummary", "summary"), textValue(root, "raceStrategy", "race_strategy"), weeks));
        } catch (JsonProcessingException ex) {
            return Optional.empty();
        }
    }

    private List<AiWeek> parseNestedAiWeeks(JsonNode root) {
        List<AiWeek> weeks = new ArrayList<>();
        for (JsonNode weekNode : root.path("weeks")) {
            List<AiSession> sessions = new ArrayList<>();
            for (JsonNode sessionNode : weekNode.path("sessions")) {
                sessions.add(aiSession(sessionNode));
            }
            weeks.add(new AiWeek(weekNode.path("weekNumber").asInt(), textValue(weekNode, "focus"), sessions));
        }
        return weeks;
    }

    private List<AiWeek> parseFlatAiWeeks(JsonNode root) {
        List<AiWeek> weeks = new ArrayList<>();
        for (JsonNode focusNode : root.path("weekFocus")) {
            int weekNumber = focusNode.path("weekNumber").asInt();
            List<AiSession> sessions = new ArrayList<>();
            for (JsonNode sessionNode : root.path("sessionGuidance")) {
                if (sessionNode.path("weekNumber").asInt() == weekNumber) {
                    sessions.add(aiSession(sessionNode));
                }
            }
            weeks.add(new AiWeek(weekNumber, textValue(focusNode, "focus"), sessions));
        }
        if (weeks.isEmpty()) {
            for (JsonNode sessionNode : root.path("sessionGuidance")) {
                int weekNumber = sessionNode.path("weekNumber").asInt();
                Optional<AiWeek> existing = weeks.stream().filter(week -> week.weekNumber() == weekNumber).findFirst();
                if (existing.isPresent()) {
                    existing.get().sessions().add(aiSession(sessionNode));
                } else {
                    List<AiSession> sessions = new ArrayList<>();
                    sessions.add(aiSession(sessionNode));
                    weeks.add(new AiWeek(weekNumber, null, sessions));
                }
            }
        }
        return weeks;
    }

    private AiSession aiSession(JsonNode sessionNode) {
        return new AiSession(
                sessionNode.path("sessionIndex").asInt(),
                textValue(sessionNode, "title"),
                textValue(sessionNode, "mainWorkout", "main_workout", "workout"),
                textValue(sessionNode, "warmup", "warmUp"),
                textValue(sessionNode, "purpose"),
                textValue(sessionNode, "effortCue", "effort", "effort_cue"),
                textValue(sessionNode, "cooldown", "coolDown"),
                textValue(sessionNode, "caution", "safety", "safetyNote"));
    }

    private String extractJsonObject(String aiResponse) {
        if (aiResponse == null || aiResponse.isBlank()) {
            return null;
        }
        String cleaned = aiResponse.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }
        int firstBrace = cleaned.indexOf('{');
        int lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace < 0 || lastBrace <= firstBrace) {
            return null;
        }
        return cleaned.substring(firstBrace, lastBrace + 1);
    }

    private String textValue(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = node.path(field);
            if (!value.isMissingNode() && !value.isNull() && !value.asText().isBlank()) {
                return value.asText();
            }
        }
        return null;
    }

    private boolean validAiPlan(AiPlanResponse aiPlan, TrainingPlan plan) {
        if ((blank(aiPlan.planTitle()) && blank(aiPlan.coachSummary())) || aiPlan.weeks() == null || aiPlan.weeks().isEmpty()) {
            return false;
        }
        int matchedSessions = 0;
        for (TrainingWeek week : orderedWeeks(plan)) {
            Optional<AiWeek> aiWeek = aiPlan.weeks().stream().filter(item -> item.weekNumber() == week.getWeekNumber()).findFirst();
            if (aiWeek.isEmpty() || aiWeek.get().sessions() == null) {
                continue;
            }
            for (int index = 0; index < week.getSessions().size(); index++) {
                int sessionIndex = index + 1;
                boolean hasUsableSession = aiWeek.get().sessions().stream()
                        .anyMatch(session -> session.sessionIndex() == sessionIndex
                                && (!blank(session.title()) || !blank(session.mainWorkout()) || !blank(session.purpose()) || !blank(session.effortCue())));
                if (hasUsableSession) {
                    matchedSessions++;
                }
            }
        }
        return matchedSessions > 0;
    }

    private List<TrainingWeek> orderedWeeks(TrainingPlan plan) {
        return plan.getWeeks().stream().sorted(Comparator.comparing(TrainingWeek::getWeekNumber)).toList();
    }

    private List<TrainingSession> orderedSessions(TrainingWeek week) {
        return week.getSessions().stream().sorted(Comparator.comparing(TrainingSession::getScheduledDate)).toList();
    }

    private String coachNotesFrom(AiSession aiSession, TrainingSession session, RunnerProfile profile) {
        return "Warmup: " + clean(aiSession.warmup(), "5 minutes brisk walk or very easy jog.", 180) + " "
                + "Purpose: " + clean(aiSession.purpose(), purposeFor(session.getType()), 220) + " "
                + "Effort: " + clean(aiSession.effortCue(), effortFor(session.getType()), 180) + " "
                + "Cooldown: " + clean(aiSession.cooldown(), "5 minutes easy walk.", 180) + " "
                + "Caution: " + clean(aiSession.caution(), cautionFor(profile), 240);
    }

    private String clean(String value, String fallback, int maxLength) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String cleaned = value.replace("<", "[")
                .replace(">", "]")
                .replace("```", "")
                .replaceAll("(?i)\\?(?=min|km)", " ")
                .replaceAll("\\?(?=Week|week)", "-")
                .replaceAll("\\?(?=K|k)", "")
                .replaceAll("(?<=Weeks)\\?", " ")
                .replaceAll("(?<=\\d)\\?(?=\\d)", "-")
                .trim();
        return cleaned.length() <= maxLength ? cleaned : cleaned.substring(0, maxLength - 1).trim();
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private boolean conservativeProfile(RunnerProfile profile) {
        return profile.getLevel() == RunnerLevel.BEGINNER || profile.getLevel() == RunnerLevel.RETURNING || hasHealthNotes(profile);
    }

    private String intensityFor(SessionType type) {
        return switch (type) {
            case RACE_DAY -> "race effort";
            case FARTLEK -> "light quality";
            case INTERVALS, TEMPO -> "moderate";
            default -> "easy";
        };
    }

    private double minutesPerKm(RunnerProfile profile, SessionType type) {
        double base = profile.getLevel() == RunnerLevel.BEGINNER ? 9.0 : 8.0;
        if (type == SessionType.RACE_DAY) {
            return base;
        }
        if (type == SessionType.LONG_RUN || type == SessionType.RECOVERY) {
            return base + 0.5;
        }
        if (type == SessionType.FARTLEK) {
            return Math.max(6.5, base - 0.5);
        }
        if (type == SessionType.INTERVALS || type == SessionType.TEMPO) {
            return Math.max(6.0, base - 1.0);
        }
        return base;
    }

    private String titleFor(SessionType type) {
        return switch (type) {
            case RACE_DAY -> "Race day";
            case LONG_RUN -> "Steady long run";
            case FARTLEK -> "Light fartlek speed play";
            case INTERVALS -> "Controlled interval session";
            case TEMPO -> "Comfortably hard tempo";
            case RECOVERY -> "Recovery jog";
            case REST -> "Rest day";
            case CROSS_TRAINING -> "Low-impact cross training";
            default -> "Easy aerobic run";
        };
    }

    private String mainWorkoutFor(SessionType type, double distance) {
        return switch (type) {
            case RACE_DAY -> "Complete the " + distance + " km race calmly. Start controlled, stay relaxed, and adjust by feel instead of chasing pace.";
            case LONG_RUN -> "Run " + distance + " km at an easy, steady effort. Keep it relaxed enough to speak in short sentences.";
            case FARTLEK -> "Run " + distance + " km total with short relaxed pickups inside an easy run. Keep it playful, controlled, and never all-out.";
            case INTERVALS -> "Run " + distance + " km total with short controlled faster repeats. Keep every repeat smooth, not all-out.";
            case TEMPO -> "Run " + distance + " km total with the middle portion comfortably hard, then ease back before fatigue spikes.";
            case RECOVERY -> "Run or walk-run " + distance + " km very gently. The goal is freshness, not speed.";
            default -> "Run " + distance + " km at conversational effort. Finish feeling like you could do a little more.";
        };
    }
    private String notesFor(SessionType type, RunnerProfile profile) {
        return "Warmup: 5 minutes brisk walk or very easy jog. "
                + "Purpose: " + purposeFor(type) + " "
                + "Effort: " + effortFor(type) + " "
                + "Cooldown: 5 minutes easy walk. "
                + "Caution: " + cautionFor(profile);
    }

    private String purposeFor(SessionType type) {
        return switch (type) {
            case RACE_DAY -> "Execute the goal event calmly with safety, confidence, and controlled pacing.";
            case LONG_RUN -> "Build endurance with a steady, controlled longer effort.";
            case RECOVERY -> "Keep movement gentle while supporting recovery and consistency.";
            case FARTLEK -> "Introduce speed safely with short relaxed pickups while keeping the whole session comfortable.";
            case TEMPO -> "Practice a controlled, comfortably hard rhythm without racing.";
            case INTERVALS -> "Build speed carefully with smooth repeats and full control.";
            default -> "Build aerobic consistency without chasing speed.";
        };
    }

    private String effortFor(SessionType type) {
        return switch (type) {
            case RACE_DAY -> "Controlled early, steady through the middle, and only push if you still feel safe late.";
            case FARTLEK -> "Mostly easy with brief relaxed pickups; finish fresh, not cooked.";
            case TEMPO -> "Comfortably hard, but still controlled.";
            case INTERVALS -> "Moderate on the repeats; stop if form fades.";
            default -> "Conversational and easy.";
        };
    }

    private String cautionFor(RunnerProfile profile) {
        return hasHealthNotes(profile)
                ? "Respect your health notes and stop or switch to walking if discomfort increases."
                : "Stop if pain, dizziness, chest discomfort, or unusual symptoms appear.";
    }

    private double raceDistanceKm(RunnerProfile profile) {
        String goal = goalText(profile).toLowerCase();
        if (goal.contains("10k") || goal.contains("10 k") || profile.getGoal() == TrainingGoal.FIRST_10K) {
            return 10.0;
        }
        if (goal.contains("5k") || goal.contains("5 k") || profile.getGoal() == TrainingGoal.FIRST_5K || profile.getGoal() == TrainingGoal.FASTER_5K) {
            return 5.0;
        }
        return Math.max(5.0, Math.min(10.0, weekOneTarget(profile) * 0.8));
    }

    private String raceStrategyFor(RunnerProfile profile, TrainingPlan plan) {
        if (plan.getRaceDate() == null) {
            return null;
        }
        String raceDistance = raceDistanceKm(profile) >= 10.0 ? "10K" : "5K";
        String goal = goalText(profile);
        return "Race strategy for " + raceDistance + ": use the first third to settle into control, the middle to hold steady rhythm, and the final third to build only if breathing, form, and comfort still feel safe. This plan supports " + goal + " with gradual mileage, one appropriate quality touch in build weeks, a taper into race day, and an easy recovery week after the event.";
    }
    private String buildTitle(RunnerProfile profile) {
        return "4-week " + goalText(profile).toLowerCase() + " plan";
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

    private String normalizedGoalText(RunnerProfileRequest request) {
        if (request.goalText() != null && !request.goalText().isBlank()) {
            return request.goalText().trim();
        }
        return request.goal() == null ? "Build running consistency safely" : request.goal().name().replace('_', ' ').toLowerCase();
    }

    private String goalText(RunnerProfile profile) {
        return profile.getGoalText() == null || profile.getGoalText().isBlank()
                ? profile.getGoal().name().replace('_', ' ').toLowerCase()
                : profile.getGoalText();
    }

    private TrainingGoal classifyGoal(String goalText) {
        String normalized = goalText == null ? "" : goalText.toLowerCase();
        if (normalized.contains("10k") || normalized.contains("10 k")) {
            return TrainingGoal.FIRST_10K;
        }
        if (normalized.contains("faster") || normalized.contains("speed") || normalized.contains("time") || normalized.contains("pr")) {
            return TrainingGoal.FASTER_5K;
        }
        if (normalized.contains("5k") || normalized.contains("5 k")) {
            return TrainingGoal.FIRST_5K;
        }
        if (normalized.contains("base") || normalized.contains("mileage") || normalized.contains("endurance")) {
            return TrainingGoal.ENDURANCE_BASE;
        }
        if (normalized.contains("consistent") || normalized.contains("habit")) {
            return TrainingGoal.CONSISTENCY;
        }
        return TrainingGoal.GENERAL_RUNNING;
    }

    private record AiPlanResponse(String planTitle, String coachSummary, String raceStrategy, List<AiWeek> weeks) {}
    private record AiWeek(int weekNumber, String focus, List<AiSession> sessions) {}
    private record AiSession(int sessionIndex, String title, String mainWorkout, String warmup, String purpose, String effortCue, String cooldown, String caution) {}
}







