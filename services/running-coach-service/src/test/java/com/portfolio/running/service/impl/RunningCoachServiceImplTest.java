package com.portfolio.running.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.portfolio.running.dto.GeneratePlanRequest;
import com.portfolio.running.dto.TrainingPlanDto;
import com.portfolio.running.dto.WorkoutLogDto;
import com.portfolio.running.dto.WorkoutLogRequest;
import com.portfolio.running.entity.CoachInsight;
import com.portfolio.running.entity.RunnerLevel;
import com.portfolio.running.entity.RunnerProfile;
import com.portfolio.running.entity.SessionStatus;
import com.portfolio.running.entity.SessionType;
import com.portfolio.running.entity.TrainingGoal;
import com.portfolio.running.entity.TrainingPlan;
import com.portfolio.running.entity.TrainingSession;
import com.portfolio.running.entity.TrainingWeek;
import com.portfolio.running.entity.WorkoutLog;
import com.portfolio.running.entity.WorkoutSource;
import com.portfolio.running.mapper.RunningCoachMapper;
import com.portfolio.running.repository.CoachInsightRepository;
import com.portfolio.running.repository.RunnerProfileRepository;
import com.portfolio.running.repository.TrainingPlanRepository;
import com.portfolio.running.repository.TrainingSessionRepository;
import com.portfolio.running.repository.WorkoutLogRepository;
import com.portfolio.running.service.CoachPromptService;
import com.portfolio.running.service.OllamaCoachClient;

@ExtendWith(MockitoExtension.class)
class RunningCoachServiceImplTest {
    @Mock private RunnerProfileRepository profileRepository;
    @Mock private TrainingPlanRepository planRepository;
    @Mock private TrainingSessionRepository sessionRepository;
    @Mock private WorkoutLogRepository workoutLogRepository;
    @Mock private CoachInsightRepository insightRepository;
    @Mock private OllamaCoachClient coachClient;

    private RunningCoachServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new RunningCoachServiceImpl(
                profileRepository,
                planRepository,
                sessionRepository,
                workoutLogRepository,
                insightRepository,
                new RunningCoachMapper(),
                coachClient,
                new CoachPromptService());
    }


    @Test
    void generatePlanCreatesConservativeWeeklyMileageAndBeginnerFriendlyDayByDaySessions() {
        RunnerProfile runner = planRunner(RunnerLevel.BEGINNER, 4, 10.0, "Monday, Wednesday, Friday, Sunday", "mild shin discomfort");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn("AI summary");
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest("mira@example.com", LocalDate.of(2026, 6, 1)));

        assertThat(plan.weeks()).hasSize(4);
        assertThat(plan.weeks().get(0).targetDistanceKm()).isEqualTo(10.0);
        assertThat(plan.weeks().get(1).targetDistanceKm()).isEqualTo(10.8);
        assertThat(plan.weeks().get(2).targetDistanceKm()).isEqualTo(11.7);
        assertThat(plan.weeks().get(3).targetDistanceKm()).isEqualTo(12.6);
        assertThat(plan.weeks().get(0).sessions()).hasSize(4);
        assertThat(plan.weeks().get(0).sessions()).allSatisfy(session -> {
            assertThat(session.type()).isIn(SessionType.EASY_RUN, SessionType.RECOVERY, SessionType.LONG_RUN);
            assertThat(session.intensity()).isEqualTo("easy");
            assertThat(session.coachNotes()).contains("Warmup:", "Purpose:", "Effort:", "Cooldown:", "Caution:");
        });
        assertThat(plan.weeks().get(0).sessions().stream().map(session -> session.scheduledDate().getDayOfWeek()).toList())
                .containsExactly(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY, DayOfWeek.SUNDAY);
    }

    @Test
    void generatePlanLimitsReturningRunnerWithHealthNotesToGradualMileageGrowthAndNoBackToBackHardDays() {
        RunnerProfile runner = planRunner(RunnerLevel.RETURNING, 4, 12.5, "Tuesday, Wednesday, Friday, Saturday", "mild knee discomfort");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn("AI summary");
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest("mira@example.com", LocalDate.of(2026, 6, 1)));

        assertThat(plan.weeks().get(0).targetDistanceKm()).isEqualTo(12.5);
        assertThat(plan.weeks().get(3).targetDistanceKm()).isLessThanOrEqualTo(15.8);
        plan.weeks().forEach(week -> {
            for (int i = 1; i < week.sessions().size(); i++) {
                boolean previousHard = isHard(week.sessions().get(i - 1).type());
                boolean currentHard = isHard(week.sessions().get(i).type());
                assertThat(previousHard && currentHard).isFalse();
            }
        });
        assertThat(plan.weeks()).flatExtracting(week -> week.sessions()).allSatisfy(session ->
                assertThat(session.coachNotes()).contains("Caution:"));
    }

    private boolean isHard(SessionType type) {
        return type == SessionType.INTERVALS || type == SessionType.TEMPO;
    }

    private RunnerProfile planRunner(RunnerLevel level, int days, double recentKm, String preferredDays, String healthNotes) {
        RunnerProfile runner = new RunnerProfile();
        runner.setEmail("mira@example.com");
        runner.setName("Mira Santos");
        runner.setGoal(TrainingGoal.FIRST_10K);
        runner.setLevel(level);
        runner.setWeeklyAvailability(days);
        runner.setRecentWeeklyDistanceKm(recentKm);
        runner.setTypicalPace("8:00/km");
        runner.setPreferredRunDays(preferredDays);
        runner.setHealthNotes(healthNotes);
        return runner;
    }
    @Test
    void logWorkoutUsesSafeFallbackInsightWhenAiIsUnavailableAndPainIsHigh() {
        TrainingSession session = sessionWithRunner();
        when(sessionRepository.findById(42L)).thenReturn(Optional.of(session));
        when(workoutLogRepository.save(any(WorkoutLog.class))).thenAnswer(invocation -> {
            WorkoutLog log = invocation.getArgument(0);
            log.setId(100L);
            return log;
        });
        when(coachClient.generateFeedback(any())).thenReturn(null);
        when(insightRepository.save(any(CoachInsight.class))).thenAnswer(invocation -> {
            CoachInsight insight = invocation.getArgument(0);
            insight.setId(200L);
            return insight;
        });

        WorkoutLogRequest request = new WorkoutLogRequest(
                WorkoutSource.SCREENSHOT_OCR,
                3.2,
                29,
                "9:03",
                8,
                8,
                6,
                SessionStatus.MODIFIED,
                "Knee felt sharp near the end.");

        WorkoutLogDto result = service.logWorkout(42L, request);

        assertThat(result.id()).isEqualTo(100L);
        assertThat(result.source()).isEqualTo(WorkoutSource.SCREENSHOT_OCR);
        assertThat(result.completionStatus()).isEqualTo(SessionStatus.MODIFIED);
        assertThat(result.coachInsight()).isNotNull();
        assertThat(result.coachInsight().aiGenerated()).isFalse();
        assertThat(result.coachInsight().feedback()).contains("meaningful discomfort");
        assertThat(result.coachInsight().recoveryGuidance()).contains("Avoid hard running");
        assertThat(result.coachInsight().nextAdjustment()).contains("Replace the next hard effort");
        assertThat(result.coachInsight().safetyNote()).contains("not medical advice");
        assertThat(session.getStatus()).isEqualTo(SessionStatus.MODIFIED);
    }

    private TrainingSession sessionWithRunner() {
        RunnerProfile runner = new RunnerProfile();
        runner.setEmail("mira@example.com");
        runner.setName("Mira Santos");
        runner.setGoal(TrainingGoal.FIRST_10K);
        runner.setLevel(RunnerLevel.RETURNING);
        runner.setHealthNotes("mild knee discomfort");

        TrainingPlan plan = new TrainingPlan();
        plan.setRunner(runner);

        TrainingWeek week = new TrainingWeek();
        week.setPlan(plan);

        TrainingSession session = new TrainingSession();
        session.setId(42L);
        session.setWeek(week);
        session.setTitle("Easy aerobic run");
        session.setTargetDistanceKm(4.0);
        session.setTargetMinutes(32);
        session.setIntensity("easy");
        session.setStatus(SessionStatus.PLANNED);
        return session;
    }
}