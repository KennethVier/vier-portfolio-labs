package com.portfolio.running.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.running.dto.*;
import com.portfolio.running.entity.RunnerLevel;
import com.portfolio.running.entity.SessionStatus;
import com.portfolio.running.entity.SessionType;
import com.portfolio.running.entity.TrainingGoal;
import com.portfolio.running.entity.WorkoutSource;
import com.portfolio.running.service.RunningCoachService;

@WebMvcTest(controllers = {
        ProfileController.class,
        PlanController.class,
        DashboardController.class,
        SessionController.class,
        CoachController.class
})
class RunningCoachApiIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private RunningCoachService runningCoachService;

    @Test
    void postProfileCreatesOrUpdatesRunnerProfile() throws Exception {
        RunnerProfileRequest request = new RunnerProfileRequest(
                "mira@example.com",
                "Mira Santos",
                TrainingGoal.FIRST_10K,
                RunnerLevel.RETURNING,
                3,
                12.5,
                "8:00/km",
                "Tuesday, Thursday, Saturday",
                "mild knee discomfort");
        when(runningCoachService.saveProfile(any(RunnerProfileRequest.class))).thenReturn(profileDto());

        mockMvc.perform(post("/api/running/profiles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("mira@example.com"))
                .andExpect(jsonPath("$.goal").value("FIRST_10K"))
                .andExpect(jsonPath("$.level").value("RETURNING"))
                .andExpect(jsonPath("$.healthNotes").value("mild knee discomfort"));
    }

    @Test
    void postGeneratePlanReturnsFourWeekPlanSummary() throws Exception {
        GeneratePlanRequest request = new GeneratePlanRequest("mira@example.com", LocalDate.of(2026, 6, 4));
        when(runningCoachService.generatePlan(any(GeneratePlanRequest.class))).thenReturn(planDto());

        mockMvc.perform(post("/api/running/plans/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("4-week first 10k plan"))
                .andExpect(jsonPath("$.aiGenerated").value(true))
                .andExpect(jsonPath("$.weeks[0].weekNumber").value(1))
                .andExpect(jsonPath("$.weeks[0].sessions[0].title").value("Easy aerobic run"));
    }

    @Test
    void getDashboardReturnsNextSessionAndLatestInsight() throws Exception {
        DashboardDto dashboard = new DashboardDto(
                profileDto(),
                planDto(),
                sessionDto(),
                3.7,
                1,
                3,
                insightDto(),
                List.of(insightDto()));
        when(runningCoachService.getDashboard("mira@example.com")).thenReturn(dashboard);

        mockMvc.perform(get("/api/running/dashboard").param("email", "mira@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.email").value("mira@example.com"))
                .andExpect(jsonPath("$.nextSession.title").value("Easy aerobic run"))
                .andExpect(jsonPath("$.completedDistanceKm").value(3.7))
                .andExpect(jsonPath("$.latestInsight.feedback").value("Keep the next run easy and monitor the knee."));
    }

    @Test
    void postWorkoutLogReturnsCoachInsightAndScreenshotSource() throws Exception {
        WorkoutLogRequest request = new WorkoutLogRequest(
                WorkoutSource.SCREENSHOT_OCR,
                3.7,
                31,
                "8:22",
                7,
                8,
                4,
                SessionStatus.MODIFIED,
                "Felt heavy near the end.");
        WorkoutLogDto response = new WorkoutLogDto(
                100L,
                10L,
                WorkoutSource.SCREENSHOT_OCR,
                3.7,
                31,
                "8:22",
                7,
                8,
                4,
                SessionStatus.MODIFIED,
                "Felt heavy near the end.",
                LocalDateTime.of(2026, 6, 4, 8, 30),
                insightDto());
        when(runningCoachService.logWorkout(eq(10L), any(WorkoutLogRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/running/sessions/10/logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("SCREENSHOT_OCR"))
                .andExpect(jsonPath("$.completionStatus").value("MODIFIED"))
                .andExpect(jsonPath("$.coachInsight.feedback").value("Keep the next run easy and monitor the knee."));
    }

    @Test
    void getInsightsReturnsCoachInsightHistory() throws Exception {
        when(runningCoachService.getInsights("mira@example.com")).thenReturn(List.of(insightDto()));

        mockMvc.perform(get("/api/running/insights").param("email", "mira@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].feedback").value("Keep the next run easy and monitor the knee."))
                .andExpect(jsonPath("$[0].aiGenerated").value(true));
    }

    private RunnerProfileDto profileDto() {
        return new RunnerProfileDto(
                1L,
                "mira@example.com",
                "Mira Santos",
                TrainingGoal.FIRST_10K,
                RunnerLevel.RETURNING,
                3,
                12.5,
                "8:00/km",
                "Tuesday, Thursday, Saturday",
                "mild knee discomfort");
    }

    private TrainingPlanDto planDto() {
        return new TrainingPlanDto(
                5L,
                "4-week first 10k plan",
                "This plan is calibrated conservatively around returning fitness and mild knee discomfort.",
                LocalDate.of(2026, 6, 4),
                LocalDate.of(2026, 7, 1),
                true,
                true,
                List.of(new TrainingWeekDto(7L, 1, "Foundation", 12.5, List.of(sessionDto()))));
    }

    private TrainingSessionDto sessionDto() {
        return new TrainingSessionDto(
                10L,
                LocalDate.of(2026, 6, 6),
                SessionType.EASY_RUN,
                SessionStatus.PLANNED,
                "Easy aerobic run",
                4.0,
                32,
                "easy",
                "Keep this conversational.");
    }

    private CoachInsightDto insightDto() {
        return new CoachInsightDto(
                20L,
                10L,
                100L,
                "Keep the next run easy and monitor the knee.",
                "Prioritize recovery and avoid hard running until fatigue settles.",
                "Continue with the next easy session only if symptoms settle.",
                "This is coaching guidance, not medical advice.",
                true,
                LocalDateTime.of(2026, 6, 4, 8, 31));
    }
}