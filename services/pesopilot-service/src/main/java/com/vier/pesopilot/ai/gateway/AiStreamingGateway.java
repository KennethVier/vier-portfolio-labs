package com.vier.pesopilot.ai.gateway;

import com.vier.pesopilot.ai.dto.AiExplanationRequest;
import com.vier.pesopilot.ai.dto.streaming.AiStreamEventDto;
import com.vier.pesopilot.ai.execution.AiStreamingExecutionHandle;
import java.util.function.Consumer;

public interface AiStreamingGateway {

    AiStreamingExecutionHandle streamExplanation(
            AiExplanationRequest request,
            Consumer<AiStreamEventDto> eventConsumer
    );
}
