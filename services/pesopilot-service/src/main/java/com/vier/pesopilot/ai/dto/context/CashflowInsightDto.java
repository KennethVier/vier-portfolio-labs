package com.vier.pesopilot.ai.dto.context;

public record CashflowInsightDto(
        Double remainingCash,
        Double netCashflow,
        String position,
        String spendingPace,
        Double incomeCoverage,
        Double savingsCoverage,
        String stability
) {}
