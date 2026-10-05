package com.vier.pesopilot.ai.dto;

import com.vier.pesopilot.ai.dto.context.AiPromptContextDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record AiExplanationRequest(
        @NotNull(message = "context is required")
        @Valid
        AiPromptContextDto context
) {}
