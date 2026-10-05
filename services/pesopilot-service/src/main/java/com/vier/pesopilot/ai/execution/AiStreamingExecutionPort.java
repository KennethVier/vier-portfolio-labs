package com.vier.pesopilot.ai.execution;

import com.vier.pesopilot.ai.dto.streaming.AiStreamEventDto;
import java.util.function.Consumer;

public interface AiStreamingExecutionPort {

    AiStreamingExecutionHandle start(
            AiExecutionCommand command,
            Consumer<AiStreamEventDto> eventConsumer
    );
}
