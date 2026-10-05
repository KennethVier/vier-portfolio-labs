package com.vier.pesopilot.ai.dto.context;

public record SummaryMetadataDto(
        String summaryId,
        String summaryType,
        String engineVersion,
        String narrativeVersion,
        String templateVersion,
        String language
) {}
