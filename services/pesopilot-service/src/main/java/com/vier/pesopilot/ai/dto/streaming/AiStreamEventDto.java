package com.vier.pesopilot.ai.dto.streaming;

public record AiStreamEventDto(
        String version,
        String streamId,
        long sequence,
        String eventType,
        Object payload,
        String timestamp
) {}
