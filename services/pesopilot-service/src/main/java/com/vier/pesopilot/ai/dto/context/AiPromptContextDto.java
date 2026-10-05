package com.vier.pesopilot.ai.dto.context;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record AiPromptContextDto(
        String version,
        String scope,
        SourceTimestampsDto sourceTimestamps,

        @NotNull(message = "financialSummary is required")
        @Valid
        FinancialSummaryDto financialSummary,

        @NotNull(message = "recommendations is required")
        @Valid
        List<RecommendationItemDto> recommendations,

        @NotNull(message = "insights is required")
        @Valid
        InsightsDto insights,

        @Valid
        ConversationContextDto conversationContext,

        @Valid
        MemoryContextDto memoryContext
) {}
