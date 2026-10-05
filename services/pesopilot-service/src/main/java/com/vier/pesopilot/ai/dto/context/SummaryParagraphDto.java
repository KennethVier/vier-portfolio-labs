package com.vier.pesopilot.ai.dto.context;

import java.util.List;

public record SummaryParagraphDto(
        String key,
        String text,
        String horizon,
        List<String> relatedInsights,
        List<String> relatedRecommendations
) {}
