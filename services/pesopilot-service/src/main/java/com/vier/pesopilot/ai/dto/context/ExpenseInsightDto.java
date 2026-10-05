package com.vier.pesopilot.ai.dto.context;

public record ExpenseInsightDto(
        Double totalExpenses,
        Integer expenseCount,
        Double dailySpendingRate,
        Integer currentPeriodDays,
        String topSpendingCategory,
        String trend,
        Double increase,
        Double decrease
) {}
