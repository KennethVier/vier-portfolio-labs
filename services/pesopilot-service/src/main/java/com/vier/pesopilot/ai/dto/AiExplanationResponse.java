package com.vier.pesopilot.ai.dto;

import java.time.Instant;

public record AiExplanationResponse(
        String requestId,
        String explanation,
        Instant generatedAt
) {}
