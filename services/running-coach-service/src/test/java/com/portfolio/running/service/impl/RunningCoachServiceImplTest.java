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
import com.portfolio.running.dto.RunnerProfileRequest;
import com.portfolio.running.dto.TrainingPlanDto;
import com.portfolio.running.dto.WorkoutLogDto;
import com.portfolio.running.dto.WorkoutLogRequest;
import com.portfolio.running.entity.*;
import com.portfolio.running.mapper.RunningCoachMapper;
import com.portfolio.running.repository.*;
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
    void saveProfileAcceptsFreeformGoalAndClassifiesItInternally() {
        RunnerProfile saved = new RunnerProfile();
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.empty());
        when(profileRepository.save(any(RunnerProfile.class))).thenAnswer(invocation -> {
            RunnerProfile profile = invocation.getArgument(0);
            profile.setId(1L);
            return profile;
        });

        var result = service.saveProfile(new RunnerProfileRequest(
                "mira@example.com",
                "Mira Santos",
                null,
                "I want to improve my 5K time without aggravating my knee.",
                RunnerLevel.RETURNING,
                3,
                12.5,
                "8:00/km",
                "Tuesday, Thursday, Saturday",
                "mild knee discomfort"));

        assertThat(saved.getId()).isNull();
        assertThat(result.goalText()).isEqualTo("I want to improve my 5K time without aggravating my knee.");
        assertThat(result.goal()).isEqualTo(TrainingGoal.FASTER_5K);
    }

    @Test
    void generatePlanCreatesConservativeMileageSpacedDaysAndFallbackMainWorkoutWhenAiInvalid() {
        RunnerProfile runner = planRunner(RunnerLevel.BEGINNER, 4, 10.0, "Monday, Tuesday, Wednesday, Saturday", "mild shin discomfort");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn("AI summary that is not valid JSON");
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest("mira@example.com", LocalDate.of(2026, 6, 1), null));

        assertThat(plan.aiGenerated()).isFalse();
        assertThat(plan.weeks()).hasSize(4);
        assertThat(plan.weeks().get(0).targetDistanceKm()).isEqualTo(9.5);
        assertThat(plan.weeks().get(0).sessions()).hasSize(4);
        assertThat(plan.weeks().get(0).sessions().stream().mapToDouble(session -> session.targetDistanceKm()).sum())
                .isEqualTo(plan.weeks().get(0).targetDistanceKm());
        assertThat(plan.weeks().get(0).sessions()).allSatisfy(session -> {
            assertThat(session.mainWorkout()).contains("km");
            assertThat(session.coachNotes()).contains("Warmup:", "Purpose:", "Effort:", "Cooldown:", "Caution:");
        });
        assertThat(plan.weeks().get(0).sessions().stream().map(session -> session.scheduledDate().getDayOfWeek()).toList())
                .containsExactly(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.SATURDAY);
    }

    @Test
    void generatePlanAppliesValidAiGuidanceWithoutChangingProtectedSchedule() {
        RunnerProfile runner = planRunner(RunnerLevel.RETURNING, 3, 12.5, "Tuesday, Thursday, Saturday", "mild knee discomfort");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn(validAiPlanJson());
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest("mira@example.com", LocalDate.of(2026, 6, 1), null));

        assertThat(plan.aiGenerated()).isTrue();
        assertThat(plan.title()).isEqualTo("4-week knee-smart 10K rebuild");
        assertThat(plan.coachSummary()).contains("steady rebuild");
        assertThat(plan.weeks().get(0).focus()).isEqualTo("AI foundation");
        assertThat(plan.weeks().get(0).sessions().get(0).mainWorkout()).isEqualTo("Run the assigned distance at easy conversational effort.");
        assertThat(plan.weeks().get(0).sessions().get(0).targetDistanceKm()).isEqualTo(11.9 * 0.3, offset(0.2));
    }

    @Test
    void generatePlanAppliesFlatAiGuidanceContract() {
        RunnerProfile runner = planRunner(RunnerLevel.RETURNING, 3, 12.5, "Tuesday, Thursday, Saturday", "mild knee discomfort");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn(flatAiPlanJson());
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest("mira@example.com", LocalDate.of(2026, 6, 1), null));

        assertThat(plan.aiGenerated()).isTrue();
        assertThat(plan.title()).isEqualTo("4-week flat JSON rebuild");
        assertThat(plan.weeks().get(0).focus()).isEqualTo("Flat foundation");
        assertThat(plan.weeks().get(0).sessions().get(0).mainWorkout()).isEqualTo("Run the backend distance easily from the flat response.");
    }

    @Test
    void generatePlanUsesAiJsonEvenWhenModelWrapsItInTextAndAliasesFields() {
        RunnerProfile runner = planRunner(RunnerLevel.RETURNING, 3, 12.5, "Tuesday, Thursday, Saturday", "mild knee discomfort");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn(wrappedAiPlanJson());
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest("mira@example.com", LocalDate.of(2026, 6, 1), null));

        assertThat(plan.aiGenerated()).isTrue();
        assertThat(plan.title()).isEqualTo("4-week wrapped JSON rebuild");
        assertThat(plan.weeks().get(0).sessions().get(0).mainWorkout()).isEqualTo("Run the assigned distance gently from the wrapped response.");
        assertThat(plan.weeks().get(0).sessions().get(0).targetDistanceKm()).isEqualTo(11.9 * 0.3, offset(0.2));
    }

    @Test
    void generatePlanLimitsReturningRunnerWithHealthNotesToNoBackToBackHardDays() {
        RunnerProfile runner = planRunner(RunnerLevel.RETURNING, 4, 12.5, "Tuesday, Wednesday, Friday, Saturday", "mild knee discomfort");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn(null);
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest("mira@example.com", LocalDate.of(2026, 6, 1), null));

        assertThat(plan.weeks().get(0).targetDistanceKm()).isEqualTo(11.9);
        assertThat(plan.weeks().get(3).targetDistanceKm()).isLessThanOrEqualTo(15.0);
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

    @Test
    void standardPlanNeverSchedulesSessionsBeforeStartDate() {
        RunnerProfile runner = planRunner(RunnerLevel.BEGINNER, 3, 8.0, "Monday, Wednesday, Friday", "");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn(null);
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LocalDate startDate = LocalDate.of(2026, 6, 5);
        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest("mira@example.com", startDate, null));

        assertThat(plan.planType()).isEqualTo(PlanType.STANDARD_4_WEEK);
        assertThat(plan.raceDate()).isNull();
        assertThat(plan.weeks()).hasSize(4);
        assertThat(plan.weeks()).flatExtracting(week -> week.sessions()).allSatisfy(session ->
                assertThat(session.scheduledDate()).isAfterOrEqualTo(startDate));
    }

    @Test
    void raceDatePlanRunsThroughRaceAndAddsRecoveryWeek() {
        RunnerProfile runner = planRunner(RunnerLevel.RETURNING, 3, 12.5, "Tuesday, Thursday, Saturday", "mild knee discomfort");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn(null);
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LocalDate startDate = LocalDate.of(2026, 6, 5);
        LocalDate raceDate = LocalDate.of(2026, 6, 25);
        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest("mira@example.com", startDate, raceDate));

        assertThat(plan.planType()).isEqualTo(PlanType.RACE_DATE_BASED);
        assertThat(plan.raceDate()).isEqualTo(raceDate);
        assertThat(plan.endDate()).isEqualTo(raceDate.plusDays(7));
        assertThat(plan.weeks()).hasSize(4);
        assertThat(plan.weeks()).flatExtracting(week -> week.sessions()).allSatisfy(session ->
                assertThat(session.scheduledDate()).isAfterOrEqualTo(startDate));
        assertThat(plan.weeks().get(2).sessions()).anySatisfy(session -> {
            assertThat(session.type()).isEqualTo(SessionType.RACE_DAY);
            assertThat(session.scheduledDate()).isEqualTo(raceDate);
        });
        assertThat(plan.weeks().get(3).focus()).isEqualTo("Post-race recovery");
        assertThat(plan.weeks().get(3).sessions()).allSatisfy(session -> assertThat(session.type()).isEqualTo(SessionType.RECOVERY));
    }

    @Test
    void raceDateEqualToStartDateCreatesRaceDayPlusRecoveryWeek() {
        RunnerProfile runner = planRunner(RunnerLevel.RETURNING, 3, 12.5, "Tuesday, Thursday, Saturday", "mild knee discomfort");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn(null);
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LocalDate raceDate = LocalDate.of(2026, 6, 5);
        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest("mira@example.com", raceDate, raceDate));

        assertThat(plan.weeks()).hasSize(2);
        assertThat(plan.weeks().get(0).sessions()).singleElement().satisfies(session -> {
            assertThat(session.type()).isEqualTo(SessionType.RACE_DAY);
            assertThat(session.scheduledDate()).isEqualTo(raceDate);
        });
        assertThat(plan.weeks().get(1).sessions()).allSatisfy(session -> assertThat(session.type()).isEqualTo(SessionType.RECOVERY));
    }

    @Test
    void raceDateBeforeStartDateIsRejected() {
        RunnerProfile runner = planRunner(RunnerLevel.BEGINNER, 3, 8.0, "Monday, Wednesday, Friday", "");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.generatePlan(
                new GeneratePlanRequest("mira@example.com", LocalDate.of(2026, 6, 5), LocalDate.of(2026, 6, 4))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Race date must be on or after");
    }


    @Test
    void preferredRunDaysAreStrictAndStartDateIsIncludedWhenItMatches() {
        RunnerProfile runner = planRunner(RunnerLevel.ADVANCED, 5, 35.0, "Monday, Tuesday, Wednesday, Friday, Saturday", "");
        runner.setGoalText("Sub-45 10km");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn(null);
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest(
                "mira@example.com",
                LocalDate.of(2026, 6, 6),
                LocalDate.of(2026, 8, 30)));

        assertThat(plan.weeks().get(0).sessions().stream().map(session -> session.scheduledDate()).toList())
                .containsExactly(
                        LocalDate.of(2026, 6, 6),
                        LocalDate.of(2026, 6, 8),
                        LocalDate.of(2026, 6, 9),
                        LocalDate.of(2026, 6, 10),
                        LocalDate.of(2026, 6, 12));
        assertThat(plan.weeks().get(1).sessions().get(0).scheduledDate()).isEqualTo(LocalDate.of(2026, 6, 13));
        assertThat(plan.weeks()).flatExtracting(week -> week.sessions())
                .filteredOn(session -> session.type() != SessionType.RACE_DAY)
                .allSatisfy(session -> assertThat(session.scheduledDate().getDayOfWeek()).isIn(
                        DayOfWeek.MONDAY,
                        DayOfWeek.TUESDAY,
                        DayOfWeek.WEDNESDAY,
                        DayOfWeek.FRIDAY,
                        DayOfWeek.SATURDAY));
    }

    @Test
    void partialWeekDoesNotBackfillNonPreferredDays() {
        RunnerProfile runner = planRunner(RunnerLevel.INTERMEDIATE, 5, 20.0, "Monday, Wednesday, Friday", "");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn(null);
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest(
                "mira@example.com",
                LocalDate.of(2026, 6, 6),
                null));

        assertThat(plan.weeks().get(0).sessions().stream().map(session -> session.scheduledDate()).toList())
                .containsExactly(
                        LocalDate.of(2026, 6, 8),
                        LocalDate.of(2026, 6, 10),
                        LocalDate.of(2026, 6, 12));
        assertThat(plan.weeks().get(0).sessions()).noneSatisfy(session ->
                assertThat(session.scheduledDate().getDayOfWeek()).isEqualTo(DayOfWeek.SUNDAY));
    }

    @Test
    void beginnerRacePlanIntroducesLightFartlekAfterFoundationWithoutIntervals() {
        RunnerProfile runner = planRunner(RunnerLevel.BEGINNER, 4, 14.0, "Monday, Wednesday, Friday, Saturday", "");
        runner.setGoalText("I want to finish my first 10K confidently.");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn(null);
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest(
                "mira@example.com",
                LocalDate.of(2026, 6, 6),
                LocalDate.of(2026, 7, 19)));

        assertThat(plan.raceStrategy()).contains("Race strategy", "10K");
        assertThat(plan.weeks().get(0).sessions()).noneSatisfy(session -> assertThat(session.type()).isEqualTo(SessionType.FARTLEK));
        assertThat(plan.weeks()).flatExtracting(week -> week.sessions())
                .anySatisfy(session -> assertThat(session.type()).isEqualTo(SessionType.FARTLEK));
        assertThat(plan.weeks()).flatExtracting(week -> week.sessions())
                .noneSatisfy(session -> assertThat(session.type()).isIn(SessionType.INTERVALS, SessionType.TEMPO));
    }

    @Test
    void advancedRacePlanAddsAtMostOneQualitySessionPerBuildWeek() {
        RunnerProfile runner = planRunner(RunnerLevel.ADVANCED, 5, 35.0, "Monday, Tuesday, Wednesday, Friday, Saturday", "");
        runner.setGoalText("Sub-45 10km");
        when(profileRepository.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(runner));
        when(planRepository.findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(runner)).thenReturn(Optional.empty());
        when(coachClient.generatePlan(any())).thenReturn(null);
        when(planRepository.save(any(TrainingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TrainingPlanDto plan = service.generatePlan(new GeneratePlanRequest(
                "mira@example.com",
                LocalDate.of(2026, 6, 6),
                LocalDate.of(2026, 8, 30)));

        assertThat(plan.raceStrategy()).contains("Sub-45 10km", "taper", "recovery");
        assertThat(plan.weeks().get(0).sessions()).noneSatisfy(session -> assertThat(isHard(session.type())).isTrue());
        assertThat(plan.weeks()).anySatisfy(week -> assertThat(week.sessions()).anySatisfy(session -> assertThat(session.type()).isEqualTo(SessionType.TEMPO)));
        assertThat(plan.weeks()).anySatisfy(week -> assertThat(week.sessions()).anySatisfy(session -> assertThat(session.type()).isEqualTo(SessionType.INTERVALS)));
        plan.weeks().forEach(week -> assertThat(week.sessions().stream().filter(session -> isHard(session.type())).count()).isLessThanOrEqualTo(1));
        plan.weeks().forEach(week -> {
            for (int i = 1; i < week.sessions().size(); i++) {
                assertThat(isHard(week.sessions().get(i - 1).type()) && isHard(week.sessions().get(i).type())).isFalse();
            }
        });
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

    private boolean isHard(SessionType type) {
        return type == SessionType.INTERVALS || type == SessionType.TEMPO || type == SessionType.FARTLEK;
    }

    private RunnerProfile planRunner(RunnerLevel level, int days, double recentKm, String preferredDays, String healthNotes) {
        RunnerProfile runner = new RunnerProfile();
        runner.setEmail("mira@example.com");
        runner.setName("Mira Santos");
        runner.setGoal(TrainingGoal.FIRST_10K);
        runner.setGoalText("I want to rebuild safely toward my first 10K.");
        runner.setLevel(level);
        runner.setWeeklyAvailability(days);
        runner.setRecentWeeklyDistanceKm(recentKm);
        runner.setTypicalPace("8:00/km");
        runner.setPreferredRunDays(preferredDays);
        runner.setHealthNotes(healthNotes);
        return runner;
    }

    private TrainingSession sessionWithRunner() {
        RunnerProfile runner = planRunner(RunnerLevel.RETURNING, 3, 12.5, "Tuesday, Thursday, Saturday", "mild knee discomfort");

        TrainingPlan plan = new TrainingPlan();
        plan.setRunner(runner);

        TrainingWeek week = new TrainingWeek();
        week.setPlan(plan);

        TrainingSession session = new TrainingSession();
        session.setId(42L);
        session.setWeek(week);
        session.setTitle("Easy aerobic run");
        session.setMainWorkout("Run 4.0 km easy.");
        session.setTargetDistanceKm(4.0);
        session.setTargetMinutes(32);
        session.setIntensity("easy");
        session.setStatus(SessionStatus.PLANNED);
        return session;
    }

    private String flatAiPlanJson() {
        String focus = """
                {"weekNumber":1,"focus":"Flat foundation"},
                {"weekNumber":2,"focus":"Flat build"},
                {"weekNumber":3,"focus":"Flat sharpen"},
                {"weekNumber":4,"focus":"Flat confidence"}
                """;
        String guidance = """
                {"weekNumber":1,"sessionIndex":1,"title":"Flat easy run","mainWorkout":"Run the backend distance easily from the flat response.","warmup":"Walk 5 minutes.","purpose":"Build rhythm.","effortCue":"Easy talk-test effort.","cooldown":"Walk 5 minutes.","caution":"Stop if knee discomfort rises."},
                {"weekNumber":1,"sessionIndex":2,"title":"Flat recovery run","mainWorkout":"Keep this gentle.","warmup":"Walk 5 minutes.","purpose":"Support recovery.","effortCue":"Very relaxed.","cooldown":"Walk 5 minutes.","caution":"Stop if knee discomfort rises."},
                {"weekNumber":1,"sessionIndex":3,"title":"Flat long run","mainWorkout":"Run the longer backend distance steadily.","warmup":"Walk 5 minutes.","purpose":"Build endurance.","effortCue":"Easy and patient.","cooldown":"Walk 5 minutes.","caution":"Stop if knee discomfort rises."},
                {"weekNumber":2,"sessionIndex":1,"title":"Flat easy run","mainWorkout":"Run the backend distance easily.","purpose":"Build rhythm.","effortCue":"Easy."},
                {"weekNumber":2,"sessionIndex":2,"title":"Flat recovery run","mainWorkout":"Keep this gentle.","purpose":"Support recovery.","effortCue":"Easy."},
                {"weekNumber":2,"sessionIndex":3,"title":"Flat long run","mainWorkout":"Run steadily.","purpose":"Build endurance.","effortCue":"Easy."},
                {"weekNumber":3,"sessionIndex":1,"title":"Flat easy run","mainWorkout":"Run easily.","purpose":"Build rhythm.","effortCue":"Easy."},
                {"weekNumber":3,"sessionIndex":2,"title":"Flat recovery run","mainWorkout":"Keep this gentle.","purpose":"Support recovery.","effortCue":"Easy."},
                {"weekNumber":3,"sessionIndex":3,"title":"Flat long run","mainWorkout":"Run steadily.","purpose":"Build endurance.","effortCue":"Easy."},
                {"weekNumber":4,"sessionIndex":1,"title":"Flat easy run","mainWorkout":"Run easily.","purpose":"Build rhythm.","effortCue":"Easy."},
                {"weekNumber":4,"sessionIndex":2,"title":"Flat recovery run","mainWorkout":"Keep this gentle.","purpose":"Support recovery.","effortCue":"Easy."},
                {"weekNumber":4,"sessionIndex":3,"title":"Flat long run","mainWorkout":"Run steadily.","purpose":"Build endurance.","effortCue":"Easy."}
                """;
        return """
                {"planTitle":"4-week flat JSON rebuild","coachSummary":"Flat response summary.","weekFocus":[%s],"sessionGuidance":[%s]}
                """.formatted(focus, guidance);
    }

    private String wrappedAiPlanJson() {
        String sessions = """
                {"sessionIndex":1,"title":"Wrapped easy run","main_workout":"Run the assigned distance gently from the wrapped response.","warmUp":"Walk 5 minutes.","purpose":"Build rhythm.","effort":"Easy talk-test effort.","coolDown":"Walk 5 minutes.","safety":"Stop if knee discomfort rises."}
                """;
        return """
                Here is the enriched plan JSON:
                ```json
                {"title":"4-week wrapped JSON rebuild","summary":"This response is wrapped but still usable.","weeks":[
                {"weekNumber":1,"focus":"Wrapped foundation","sessions":[%s]},
                {"weekNumber":2,"focus":"Wrapped build","sessions":[%s]},
                {"weekNumber":3,"focus":"Wrapped sharpen","sessions":[%s]},
                {"weekNumber":4,"focus":"Wrapped confidence","sessions":[%s]}
                ]}
                ```
                """.formatted(sessions, sessions, sessions, sessions);
    }

    private String validAiPlanJson() {
        String sessions = """
                {"sessionIndex":1,"title":"AI easy run","mainWorkout":"Run the assigned distance at easy conversational effort.","warmup":"Walk 5 minutes.","purpose":"Build rhythm.","effortCue":"Easy talk-test effort.","cooldown":"Walk 5 minutes.","caution":"Stop if knee discomfort rises."},
                {"sessionIndex":2,"title":"AI recovery run","mainWorkout":"Keep this one gentle and relaxed.","warmup":"Walk 5 minutes.","purpose":"Support recovery.","effortCue":"Very relaxed.","cooldown":"Walk 5 minutes.","caution":"Stop if knee discomfort rises."},
                {"sessionIndex":3,"title":"AI long run","mainWorkout":"Run the assigned longer distance steadily.","warmup":"Walk 5 minutes.","purpose":"Build endurance.","effortCue":"Easy and patient.","cooldown":"Walk 5 minutes.","caution":"Stop if knee discomfort rises."}
                """;
        return """
                {"planTitle":"4-week knee-smart 10K rebuild","coachSummary":"This is a steady rebuild around current capacity.\\nEach week adds carefully without chasing pace.","weeks":[
                {"weekNumber":1,"focus":"AI foundation","sessions":[%s]},
                {"weekNumber":2,"focus":"AI build","sessions":[%s]},
                {"weekNumber":3,"focus":"AI sharpen","sessions":[%s]},
                {"weekNumber":4,"focus":"AI confidence","sessions":[%s]}
                ]}
                """.formatted(sessions, sessions, sessions, sessions);
    }

    private org.assertj.core.data.Offset<Double> offset(double value) {
        return org.assertj.core.data.Offset.offset(value);
    }
}



