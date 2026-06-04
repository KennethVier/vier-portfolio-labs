package com.portfolio.running.service;

import java.util.List;

import com.portfolio.running.dto.*;

public interface RunningCoachService {
    RunnerProfileDto saveProfile(RunnerProfileRequest request);
    RunnerProfileDto getProfileByEmail(String email);
    TrainingPlanDto generatePlan(GeneratePlanRequest request);
    TrainingPlanDto getCurrentPlan(String email);
    TrainingSessionDto getSession(Long id);
    WorkoutLogDto logWorkout(Long sessionId, WorkoutLogRequest request);
    CoachInsightDto adjustNextSession(String email);
    List<CoachInsightDto> getInsights(String email);
    DashboardDto getDashboard(String email);
}
