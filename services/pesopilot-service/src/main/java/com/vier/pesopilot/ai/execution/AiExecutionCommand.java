package com.vier.pesopilot.ai.execution;

import com.vier.pesopilot.ai.dto.context.AiPromptContextDto;

public record AiExecutionCommand(
        String requestId,
        String workflowTemplateId,
        AiPromptContextDto context
) {}
