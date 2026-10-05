package com.vier.pesopilot.ai.gateway;

import com.vier.pesopilot.ai.constant.AiApiConstants;
import com.vier.pesopilot.ai.dto.AiExplanationRequest;
import com.vier.pesopilot.ai.dto.context.AiPromptContextDto;
import com.vier.pesopilot.ai.dto.context.FinancialSummaryDto;
import com.vier.pesopilot.ai.dto.context.HealthInsightDto;
import com.vier.pesopilot.ai.dto.context.InsightsDto;
import com.vier.pesopilot.ai.dto.context.RecommendationItemDto;
import com.vier.pesopilot.ai.dto.context.SummaryMetadataDto;
import com.vier.pesopilot.ai.dto.context.SummaryParagraphDto;
import com.vier.pesopilot.ai.dto.context.SummarySectionDto;
import com.vier.pesopilot.ai.dto.streaming.AiStreamEventDto;
import com.vier.pesopilot.ai.exception.AiValidationException;
import com.vier.pesopilot.ai.execution.AiExecutionCommand;
import com.vier.pesopilot.ai.execution.AiStreamingExecutionHandle;
import com.vier.pesopilot.ai.execution.AiStreamingExecutionPort;
import com.vier.pesopilot.ai.validation.AiRequestContractValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DefaultAiStreamingGatewayTest {

    private AiStreamingExecutionPort streamingExecutionPort;
    private RequestIdGenerator requestIdGenerator;
    private AiRequestContractValidator contractValidator;
    private DefaultAiStreamingGateway gateway;

    @BeforeEach
    void setUp() {
        streamingExecutionPort = mock(AiStreamingExecutionPort.class);
        requestIdGenerator = () -> "test-stream-req-123";
        contractValidator = new AiRequestContractValidator();
        gateway = new DefaultAiStreamingGateway(streamingExecutionPort, requestIdGenerator, contractValidator);
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
                financialSummary,
                List.of(recommendation),
                insights,
                null,
                null
        );
    }

    @Test
    void streamExplanationValidatesAndDelegatesToExecutionPort() {
        AiPromptContextDto context = createSampleContext();
        AiExplanationRequest request = new AiExplanationRequest(context);
        Consumer<AiStreamEventDto> eventConsumer = event -> {};

        AiStreamingExecutionHandle handle = () -> {};
        when(streamingExecutionPort.start(any(AiExecutionCommand.class), any())).thenReturn(handle);

        AiStreamingExecutionHandle resultHandle = gateway.streamExplanation(request, eventConsumer);

        assertNotNull(resultHandle);

        ArgumentCaptor<AiExecutionCommand> captor = ArgumentCaptor.forClass(AiExecutionCommand.class);
        verify(streamingExecutionPort, times(1)).start(captor.capture(), eq(eventConsumer));

        AiExecutionCommand command = captor.getValue();
        assertEquals("test-stream-req-123", command.requestId());
        assertEquals(AiApiConstants.WORKFLOW_TEMPLATE_ID, command.workflowTemplateId());
        assertEquals(context, command.context());
    }

    @Test
    void streamExplanationThrowsAiValidationExceptionWhenContextInvalid() {
        AiPromptContextDto invalidContext = new AiPromptContextDto(
                "2.0.0", "scope", null, null, null, null, null, null
        );
        AiExplanationRequest request = new AiExplanationRequest(invalidContext);
        Consumer<AiStreamEventDto> eventConsumer = event -> {};

        assertThrows(AiValidationException.class, () -> gateway.streamExplanation(request, eventConsumer));
        verify(streamingExecutionPort, never()).start(any(), any());
    }
}
