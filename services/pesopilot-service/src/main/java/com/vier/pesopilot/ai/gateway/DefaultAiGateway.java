package com.vier.pesopilot.ai.gateway;

import com.vier.pesopilot.ai.constant.AiApiConstants;
import com.vier.pesopilot.ai.dto.AiExplanationRequest;
import com.vier.pesopilot.ai.dto.AiExplanationResponse;
import com.vier.pesopilot.ai.execution.AiExecutionCommand;
import com.vier.pesopilot.ai.execution.AiExecutionPort;
import com.vier.pesopilot.ai.execution.AiExecutionResult;
import com.vier.pesopilot.ai.validation.AiRequestContractValidator;
import org.springframework.stereotype.Service;

@Service
public class DefaultAiGateway implements AiGateway {

    private final AiExecutionPort executionPort;
    private final RequestIdGenerator requestIdGenerator;
    private final AiRequestContractValidator contractValidator;

    public DefaultAiGateway(
            AiExecutionPort executionPort,
            RequestIdGenerator requestIdGenerator,
            AiRequestContractValidator contractValidator
    ) {
        this.executionPort = executionPort;
        this.requestIdGenerator = requestIdGenerator;
        this.contractValidator = contractValidator;
    }

    @Override
    public AiExplanationResponse generateExplanation(AiExplanationRequest request) {
        contractValidator.validate(request.context());

        String requestId = requestIdGenerator.generate();
        AiExecutionCommand command = new AiExecutionCommand(
                requestId,
                AiApiConstants.WORKFLOW_TEMPLATE_ID,
                request.context()
        );

        AiExecutionResult result = executionPort.execute(command);

        return new AiExplanationResponse(
                result.requestId(),
                result.explanation(),
                result.generatedAt()
        );
    }
}
