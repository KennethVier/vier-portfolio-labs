package com.vier.pesopilot.ai.dto.context;

public record InsightsDto(
        HealthInsightDto health,
        IncomeInsightDto income,
        ExpenseInsightDto expenses,
        SavingsInsightDto savings,
        GoalInsightDto goals,
        CashflowInsightDto cashflow,
        CutoffInsightDto cutoff
) {}
