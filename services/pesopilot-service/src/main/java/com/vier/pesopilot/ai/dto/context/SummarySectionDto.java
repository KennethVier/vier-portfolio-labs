package com.vier.pesopilot.ai.dto.context;

import java.util.List;

public record SummarySectionDto(
        String type,
        String title,
        List<SummaryParagraphDto> paragraphs
) {}
