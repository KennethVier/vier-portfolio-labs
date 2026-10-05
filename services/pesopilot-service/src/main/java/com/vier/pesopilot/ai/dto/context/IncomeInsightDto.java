package com.vier.pesopilot.ai.dto.context;

public record IncomeInsightDto(
        Double totalIncome,
        Integer incomeCount,
        Double averageIncome,
        String trend,
        String previousCutoffComparison,
        Boolean missingIncome,
        String stability
) {}
