package com.vier.pesopilot.ai.dto.context;

public record CutoffInsightDto(
        String currentCutoff,
        String previousCutoffComparison,
        String averageComparison,
        String trend
) {}
