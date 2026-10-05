package com.vier.pesopilot.ai.dto.context;

public record SavingsInsightDto(
        Double totalSavings,
        Integer savingsCount,
        Double averageContribution,
        Double savingsRate,
        String trend,
        String previousCutoffComparison,
        String contributionFrequency,
        String consistency
) {}
