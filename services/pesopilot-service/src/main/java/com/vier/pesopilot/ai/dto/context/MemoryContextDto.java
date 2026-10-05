package com.vier.pesopilot.ai.dto.context;

import java.util.List;

public record MemoryContextDto(
        String version,
        List<MemoryItemDto> items
) {}
