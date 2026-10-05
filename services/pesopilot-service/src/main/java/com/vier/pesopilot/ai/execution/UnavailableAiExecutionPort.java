package com.vier.pesopilot.ai.execution;

import com.vier.pesopilot.ai.exception.AiExecutionUnavailableException;
import org.springframework.stereotype.Component;

@Component
public class UnavailableAiExecutionPort implements AiExecutionPort {

    @Override
    public AiExecutionResult execute(AiExecutionCommand command) {
        throw new AiExecutionUnavailableException("AI execution service is currently unavailable");
    }
}
