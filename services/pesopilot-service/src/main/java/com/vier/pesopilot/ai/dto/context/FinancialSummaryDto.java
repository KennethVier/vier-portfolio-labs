package com.vier.pesopilot.ai.dto.context;

import java.util.List;

public record FinancialSummaryDto(
        String version,
        String scope,
        String generatedAt,
        SummaryMetadataDto metadata,
        String state,
        List<SummarySectionDto> sections
) {}
