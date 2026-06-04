package com.portfolio.running.dto;

import java.util.List;

public record DashboardDto(
        RunnerProfileDto profile,
        TrainingPlanDto currentPlan,
        TrainingSessionDto nextSession,
        double completedDistanceKm,
        long completedSessions,
        long plannedSessions,
        CoachInsightDto latestInsight,
        List<CoachInsightDto> recentInsights) {}
