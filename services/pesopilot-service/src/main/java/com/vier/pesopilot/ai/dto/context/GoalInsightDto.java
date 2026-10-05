package com.vier.pesopilot.ai.dto.context;

public record GoalInsightDto(
        Integer totalGoals,
        Integer activeGoals,
        Integer completedGoals,
        Double totalTargetAmount,
        Double totalSavedAmount,
        Double overallCompletionRate
) {}
