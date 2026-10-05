package com.vier.pesopilot.ai.dto.context;

import java.util.List;

public record ClarificationStateDto(
        Boolean required,
        String reason,
        List<String> missingFields
) {}
