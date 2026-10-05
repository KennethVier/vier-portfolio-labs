package com.vier.pesopilot.ai.execution;

import java.time.Instant;

public record AiExecutionResult(
        String requestId,
        String explanation,
        Instant generatedAt
) {}
