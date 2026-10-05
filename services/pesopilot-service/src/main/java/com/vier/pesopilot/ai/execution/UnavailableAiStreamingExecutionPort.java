package com.vier.pesopilot.ai.execution;

import com.vier.pesopilot.ai.dto.streaming.AiStreamEventDto;
import com.vier.pesopilot.ai.exception.AiExecutionUnavailableException;
import org.springframework.stereotype.Component;
import java.util.function.Consumer;

@Component
public class UnavailableAiStreamingExecutionPort implements AiStreamingExecutionPort {

    @Override
    public AiStreamingExecutionHandle start(
            AiExecutionCommand command,
            Consumer<AiStreamEventDto> eventConsumer
    ) {
        throw new AiExecutionUnavailableException("AI streaming execution service is currently unavailable");
    }
}
