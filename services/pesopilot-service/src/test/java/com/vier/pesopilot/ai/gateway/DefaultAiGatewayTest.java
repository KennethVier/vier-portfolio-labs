package com.vier.pesopilot.ai.gateway;

import com.vier.pesopilot.ai.constant.AiApiConstants;
import com.vier.pesopilot.ai.dto.AiExplanationRequest;
import com.vier.pesopilot.ai.dto.AiExplanationResponse;
import com.vier.pesopilot.ai.dto.context.AiPromptContextDto;
import com.vier.pesopilot.ai.dto.context.FinancialSummaryDto;
import com.vier.pesopilot.ai.dto.context.HealthInsightDto;
import com.vier.pesopilot.ai.dto.context.InsightsDto;
import com.vier.pesopilot.ai.dto.context.RecommendationItemDto;
import com.vier.pesopilot.ai.dto.context.SummaryMetadataDto;
import com.vier.pesopilot.ai.dto.context.SummaryParagraphDto;
import com.vier.pesopilot.ai.dto.context.SummarySectionDto;
import com.vier.pesopilot.ai.exception.AiValidationException;
import com.vier.pesopilot.ai.execution.AiExecutionCommand;
import com.vier.pesopilot.ai.execution.AiExecutionPort;
import com.vier.pesopilot.ai.execution.AiExecutionResult;
import com.vier.pesopilot.ai.validation.AiRequestContractValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DefaultAiGatewayTest {

    private AiExecutionPort executionPort;
    private RequestIdGenerator requestIdGenerator;
    private AiRequestContractValidator contractValidator;
    private DefaultAiGateway gateway;

    @BeforeEach
    void setUp() {
        executionPort = mock(AiExecutionPort.class);
        requestIdGenerator = () -> "test-req-123";
        contractValidator = new AiRequestContractValidator();
        gateway = new DefaultAiGateway(executionPort, requestIdGenerator, contractValidator);
    }

    private AiPromptContextDto createSampleContext() {
        SummaryMetadataDto metadata = new SummaryMetadataDto("s1", "type", "1.0.0", "1.0.0", "1.0.0", "en");
        SummaryParagraphDto paragraph = new SummaryParagraphDto("p1", "text", "month", List.of(), List.of());
        SummarySectionDto section = new SummarySectionDto("t", "title", List.of(paragraph));
        FinancialSummaryDto financialSummary = new FinancialSummaryDto("1.0.0", "m", "now", metadata, "s", List.of(section));
        RecommendationItemDto recommendation = new RecommendationItemDto("r1", "savings", "a", "t", "e", "low", 1, 1, List.of(), List.of());
        InsightsDto insights = new InsightsDto(new HealthInsightDto(80, "good"), null, null, null, null, null, null);

        return new AiPromptContextDto(
                "1.0.0", "scope", null,
                financialSummary, List.of(recommendation), insights,
                null, null
        );
    }

    @Test
    void generateExplanationMapsCommandInvokesPortAndReturnsResponse() {
        AiPromptContextDto context = createSampleContext();
        AiExplanationRequest request = new AiExplanationRequest(context);
        Instant now = Instant.now();

        when(executionPort.execute(any(AiExecutionCommand.class))).thenReturn(
                new AiExecutionResult("test-req-123", "Generated explanation text.", now)
        );

        AiExplanationResponse response = gateway.generateExplanation(request);

        assertNotNull(response);
        assertEquals("test-req-123", response.requestId());
        assertEquals("Generated explanation text.", response.explanation());
        assertEquals(now, response.generatedAt());

        ArgumentCaptor<AiExecutionCommand> captor = ArgumentCaptor.forClass(AiExecutionCommand.class);
        verify(executionPort, times(1)).execute(captor.capture());

        AiExecutionCommand command = captor.getValue();
        assertEquals("test-req-123", command.requestId());
        assertEquals(AiApiConstants.WORKFLOW_TEMPLATE_ID, command.workflowTemplateId());
        assertEquals(context, command.context());
    }

    @Test
    void generateExplanationValidatesContractBeforeExecuting() {
        AiPromptContextDto invalidContext = new AiPromptContextDto(
                "invalid.version", "scope", null,
                null, List.of(), null, null, null
        );
        AiExplanationRequest request = new AiExplanationRequest(invalidContext);

        assertThrows(AiValidationException.class, () -> gateway.generateExplanation(request));
        verify(executionPort, never()).execute(any());
    }
}
