package com.vier.pesopilot.ai.gateway;

import com.vier.pesopilot.ai.constant.AiApiConstants;
import com.vier.pesopilot.ai.dto.AiExplanationRequest;
import com.vier.pesopilot.ai.dto.streaming.AiStreamEventDto;
import com.vier.pesopilot.ai.execution.AiExecutionCommand;
import com.vier.pesopilot.ai.execution.AiStreamingExecutionHandle;
import com.vier.pesopilot.ai.execution.AiStreamingExecutionPort;
import com.vier.pesopilot.ai.validation.AiRequestContractValidator;
import org.springframework.stereotype.Service;
import java.util.function.Consumer;

@Service
public class DefaultAiStreamingGateway implements AiStreamingGateway {

    private final AiStreamingExecutionPort streamingExecutionPort;
    private final RequestIdGenerator requestIdGenerator;
    private final AiRequestContractValidator contractValidator;

    public DefaultAiStreamingGateway(
            AiStreamingExecutionPort streamingExecutionPort,
            RequestIdGenerator requestIdGenerator,
            AiRequestContractValidator contractValidator
    ) {
        this.streamingExecutionPort = streamingExecutionPort;
        this.requestIdGenerator = requestIdGenerator;
        this.contractValidator = contractValidator;
    }

    @Override
    public AiStreamingExecutionHandle streamExplanation(
            AiExplanationRequest request,
            Consumer<AiStreamEventDto> eventConsumer
    ) {
        contractValidator.validate(request.context());

        String requestId = requestIdGenerator.generate();
        AiExecutionCommand command = new AiExecutionCommand(
                requestId,
                AiApiConstants.WORKFLOW_TEMPLATE_ID,
                request.context()
        );

        return streamingExecutionPort.start(command, eventConsumer);
    }
}
