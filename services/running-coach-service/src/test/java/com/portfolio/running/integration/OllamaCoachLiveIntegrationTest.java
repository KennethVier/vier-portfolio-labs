package com.portfolio.running.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.reactive.function.client.WebClient;

import com.portfolio.running.config.AiProperties;
import com.portfolio.running.entity.RunnerLevel;
import com.portfolio.running.entity.RunnerProfile;
import com.portfolio.running.entity.SessionType;
import com.portfolio.running.entity.TrainingGoal;
import com.portfolio.running.entity.TrainingPlan;
import com.portfolio.running.entity.TrainingSession;
import com.portfolio.running.entity.TrainingWeek;
import com.portfolio.running.service.CoachPromptService;
import com.portfolio.running.service.OllamaCoachClient;

class OllamaCoachLiveIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(OllamaCoachLiveIntegrationTest.class);

    @Test
    void livePlanModelReturnsUsableTrainingPlanSummaryWhenExplicitlyEnabled() throws IOException {
        if (!"true".equalsIgnoreCase(System.getenv("RUN_STRIDEMATE_LIVE_AI_TEST"))) {
            log.warn("Skipping live plan AI test. RUN_STRIDEMATE_LIVE_AI_TEST is not enabled.");
        }

        assumeTrue("true".equalsIgnoreCase(System.getenv("RUN_STRIDEMATE_LIVE_AI_TEST")),
                "Set RUN_STRIDEMATE_LIVE_AI_TEST=true to intentionally spend Ollama Cloud usage.");

        String apiKey = System.getenv("OLLAMA_API_KEY");

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Skipping live plan AI test. OLLAMA_API_KEY is missing.");
        }

        assumeTrue(apiKey != null && !apiKey.isBlank(), "Set OLLAMA_API_KEY to run the live Ollama test.");

        String baseUrl = envOrDefault("OLLAMA_BASE_URL", "https://ollama.com/api");
        String planModel = envOrDefault("OLLAMA_PLAN_MODEL", "gpt-oss:20b-cloud");
        String feedbackModel = envOrDefault("OLLAMA_FEEDBACK_MODEL", "gpt-oss:20b-cloud");

        OllamaCoachClient client = new OllamaCoachClient(
                WebClient.builder().baseUrl(baseUrl).build(),
                new AiProperties(baseUrl, apiKey, planModel, feedbackModel));

        RunnerProfile profile = sampleProfile();
        TrainingPlan generatedPlan = sampleGeneratedPlan(profile);

        String prompt = new CoachPromptService().buildPlanPrompt(profile, generatedPlan);

        log.info("Starting live plan AI test...");
        log.info("Plan Model: {}", planModel);
        log.info("Base URL: {}", baseUrl);
        log.info("Prompt length: {} characters", prompt.length());

        long startTime = System.currentTimeMillis();

        String response = client.generatePlan(prompt);

        long durationMs = System.currentTimeMillis() - startTime;

        log.info("====================================================");
        log.info("LIVE PLAN TEST RESULT");
        log.info("====================================================");
        log.info("Model: {}", planModel);
        log.info("Base URL: {}", baseUrl);
        log.info("Prompt characters: {}", prompt.length());
        log.info("Response characters: {}", response.length());
        log.info("Duration: {} ms", durationMs);

        log.info("""

                ================== AI PLAN RESPONSE ==================

                {}

                =====================================================
                """, response);

        writeToTargetFile("live-plan-prompt.txt", prompt);
        writeToTargetFile("live-plan-response.txt", response);

        assertThat(response).isNotBlank();
        assertThat(response.length()).isBetween(120, 8000);
        assertThat(response).contains("{");
        assertThat(response.toLowerCase()).containsAnyOf("plantitle", "title");
        assertThat(response.toLowerCase()).containsAnyOf("sessionguidance", "weeks");
        assertThat(response.toLowerCase()).containsAnyOf("mainworkout", "main_workout", "workout");
        assertThat(response.toLowerCase()).containsAnyOf(
                "knee",
                "health",
                "caution",
                "listen",
                "easy",
                "recovery");
        assertThat(response).doesNotContain("|---");
        assertThat(response.toLowerCase()).doesNotContain(
                "diagnosis",
                "diagnose you with",
                "guaranteed");
    }

    @Test
    void liveFeedbackModelReturnsUsableSafetyAwareCoachResponseWhenExplicitlyEnabled() throws IOException {
        if (!"true".equalsIgnoreCase(System.getenv("RUN_STRIDEMATE_LIVE_AI_TEST"))) {
            log.warn("Skipping live feedback AI test. RUN_STRIDEMATE_LIVE_AI_TEST is not enabled.");
        }

        assumeTrue("true".equalsIgnoreCase(System.getenv("RUN_STRIDEMATE_LIVE_AI_TEST")),
                "Set RUN_STRIDEMATE_LIVE_AI_TEST=true to intentionally spend Ollama Cloud usage.");

        String apiKey = System.getenv("OLLAMA_API_KEY");

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Skipping live feedback AI test. OLLAMA_API_KEY is missing.");
        }

        assumeTrue(apiKey != null && !apiKey.isBlank(), "Set OLLAMA_API_KEY to run the live Ollama test.");

        String baseUrl = envOrDefault("OLLAMA_BASE_URL", "https://ollama.com/api");
        String planModel = envOrDefault("OLLAMA_PLAN_MODEL", "gpt-oss:20b-cloud");
        String feedbackModel = envOrDefault("OLLAMA_FEEDBACK_MODEL", "gpt-oss:20b-cloud");

        OllamaCoachClient client = new OllamaCoachClient(
                WebClient.builder().baseUrl(baseUrl).build(),
                new AiProperties(baseUrl, apiKey, planModel, feedbackModel));

        String prompt = """
                You are StrideMate, a supportive analyst running coach.
                Analyze this completed workout in one compact paragraph.
                Planned workout: easy aerobic run, 4.0 km, easy intensity.
                Actual workout: 3.7 km, 31 minutes, pace 8:22/km, effort 7/10, fatigue 8/10, pain 4/10.
                Runner has mild knee discomfort.
                Give one interpretation, one recovery recommendation, and one next-session adjustment.
                Do not diagnose. Do not output JSON, markdown table, bullets, headings, or labels.
                Include safety caution if needed.
                """;

        log.info("Starting live feedback AI test...");
        log.info("Feedback Model: {}", feedbackModel);
        log.info("Base URL: {}", baseUrl);
        log.info("Prompt length: {} characters", prompt.length());

        long startTime = System.currentTimeMillis();

        String response = client.generateFeedback(prompt);

        long durationMs = System.currentTimeMillis() - startTime;

        log.info("====================================================");
        log.info("LIVE FEEDBACK TEST RESULT");
        log.info("====================================================");
        log.info("Model: {}", feedbackModel);
        log.info("Base URL: {}", baseUrl);
        log.info("Prompt characters: {}", prompt.length());
        log.info("Response characters: {}", response.length());
        log.info("Duration: {} ms", durationMs);

        log.info("""

                ================ AI FEEDBACK RESPONSE ================

                {}

                =====================================================
                """, response);

        writeToTargetFile("live-feedback-prompt.txt", prompt);
        writeToTargetFile("live-feedback-response.txt", response);

        assertThat(response).isNotBlank();
        assertThat(response.length()).isBetween(80, 1200);
        assertThat(response.toLowerCase()).containsAnyOf(
                "easy",
                "recover",
                "recovery",
                "rest",
                "caution",
                "pain",
                "fatigue",
                "knee");
        assertThat(response).doesNotContain("{", "}", "|---");
        assertThat(response.toLowerCase()).doesNotContain(
                "diagnosis",
                "diagnose you with",
                "you have a torn");
    }

    private void writeToTargetFile(String fileName, String content) throws IOException {
        Path targetDirectory = Path.of("target");
        Files.createDirectories(targetDirectory);

        Path filePath = targetDirectory.resolve(fileName);

        Files.writeString(
                filePath,
                content,
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING);

        log.info("Saved AI test output to: {}", filePath.toAbsolutePath());
    }

    private RunnerProfile sampleProfile() {
        RunnerProfile profile = new RunnerProfile();
        profile.setName("Mira Santos");
        profile.setGoal(TrainingGoal.FIRST_10K);
        profile.setLevel(RunnerLevel.RETURNING);
        profile.setWeeklyAvailability(3);
        profile.setRecentWeeklyDistanceKm(12.5);
        profile.setTypicalPace("8:00/km");
        profile.setPreferredRunDays("Tuesday, Thursday, Saturday");
        profile.setHealthNotes("mild knee discomfort");
        return profile;
    }

    private TrainingPlan sampleGeneratedPlan(RunnerProfile profile) {
        TrainingPlan plan = new TrainingPlan();
        plan.setRunner(profile);
        plan.setTitle("4-week first 10k plan");
        plan.setStartDate(LocalDate.of(2026, 6, 9));
        plan.setEndDate(LocalDate.of(2026, 7, 6));

        addWeek(plan, 1, "Foundation", 12.5,
                LocalDate.of(2026, 6, 9), 3.8,
                LocalDate.of(2026, 6, 11), 3.8,
                LocalDate.of(2026, 6, 13), 4.9);

        addWeek(plan, 2, "Gentle progression", 13.5,
                LocalDate.of(2026, 6, 16), 4.1,
                LocalDate.of(2026, 6, 18), 4.1,
                LocalDate.of(2026, 6, 20), 5.3);

        addWeek(plan, 3, "Controlled confidence", 14.6,
                LocalDate.of(2026, 6, 23), 4.4,
                LocalDate.of(2026, 6, 25), 4.4,
                LocalDate.of(2026, 6, 27), 5.8);

        addWeek(plan, 4, "Steady finish", 15.8,
                LocalDate.of(2026, 6, 30), 4.7,
                LocalDate.of(2026, 7, 2), 4.7,
                LocalDate.of(2026, 7, 4), 6.4);

        return plan;
    }

    private void addWeek(
            TrainingPlan plan,
            int number,
            String focus,
            double targetDistanceKm,
            LocalDate dayOne,
            double distanceOne,
            LocalDate dayTwo,
            double distanceTwo,
            LocalDate dayThree,
            double distanceThree) {

        TrainingWeek week = new TrainingWeek();
        week.setPlan(plan);
        week.setWeekNumber(number);
        week.setFocus(focus);
        week.setTargetDistanceKm(targetDistanceKm);

        week.getSessions().add(session(week, dayOne, SessionType.EASY_RUN, "Easy aerobic run", distanceOne));
        week.getSessions().add(session(week, dayTwo, SessionType.RECOVERY, "Recovery run", distanceTwo));
        week.getSessions().add(session(week, dayThree, SessionType.LONG_RUN, "Long easy run", distanceThree));

        plan.getWeeks().add(week);
    }

    private TrainingSession session(
            TrainingWeek week,
            LocalDate date,
            SessionType type,
            String title,
            double distanceKm) {

        TrainingSession session = new TrainingSession();
        session.setWeek(week);
        session.setScheduledDate(date);
        session.setType(type);
        session.setTitle(title);
        session.setTargetDistanceKm(distanceKm);
        session.setTargetMinutes((int) Math.round(distanceKm * 8.5));
        session.setIntensity("easy");
        session.setCoachNotes(
                "Warmup: 5 minutes brisk walk or very easy jog. " +
                        "Purpose: build aerobic consistency. " +
                        "Effort: keep it conversational. " +
                        "Cooldown: 5 minutes easy walk. " +
                        "Caution: respect mild knee discomfort and stop or switch to walking if discomfort increases.");

        return session;
    }

    private String envOrDefault(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}