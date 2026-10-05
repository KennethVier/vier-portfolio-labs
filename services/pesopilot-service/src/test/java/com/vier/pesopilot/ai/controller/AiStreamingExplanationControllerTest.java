package com.vier.pesopilot.ai.controller;

import com.vier.pesopilot.ai.dto.streaming.AiStreamEventDto;
import com.vier.pesopilot.ai.exception.AiExecutionUnavailableException;
import com.vier.pesopilot.ai.execution.AiExecutionCommand;
import com.vier.pesopilot.ai.execution.AiStreamingExecutionHandle;
import com.vier.pesopilot.ai.execution.AiStreamingExecutionPort;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.function.Consumer;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AiStreamingExplanationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AiStreamingExecutionPort streamingExecutionPort;

    private static final String VALID_PAYLOAD = """
            {
              "context": {
                "version": "1.0.0",
                "scope": "monthly",
                "financialSummary": {
                  "version": "1.0.0",
                  "scope": "monthly",
                  "generatedAt": "2026-10-05T00:00:00Z",
                  "metadata": {
                    "summaryId": "s1",
                    "summaryType": "cutoff",
                    "engineVersion": "1.0.0",
                    "narrativeVersion": "1.0.0",
                    "templateVersion": "1.0.0",
                    "language": "en"
                  },
                  "state": "active",
                  "sections": [
                    {
                      "type": "overview",
                      "title": "Overview",
                      "paragraphs": [
                        {
                          "key": "p1",
                          "text": "Savings rate healthy.",
                          "horizon": "month",
                          "relatedInsights": ["health"],
                          "relatedRecommendations": ["rec-1"]
                        }
                      ]
                    }
                  ]
                },
                "recommendations": [
                  {
                    "id": "rec-1",
                    "domain": "savings",
                    "actionKey": "increase_savings",
                    "title": "Boost Savings",
                    "explanation": "Save more.",
                    "severity": "medium",
                    "priority": 1,
                    "rank": 1,
                    "evidence": ["rate=25%"],
                    "sourceRuleIds": ["rule-1"]
                  }
                ],
                "insights": {
                  "health": {
                    "score": 85,
                    "status": "healthy"
                  }
                }
              }
            }
            """;

    @Test
    void streamExplanationWithProductionUnavailableExecutorReturns503() throws Exception {
        when(streamingExecutionPort.start(any(AiExecutionCommand.class), any()))
                .thenThrow(new AiExecutionUnavailableException("AI streaming execution service is currently unavailable"));

        MvcResult result = mockMvc.perform(post("/api/v1/ai/explanations/stream")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PAYLOAD))
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("AI streaming execution service is currently unavailable"))
                .andExpect(jsonPath("$.data").value(nullValue()))
                .andExpect(jsonPath("$.error").doesNotExist())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("event:"));
        assertFalse(body.contains("text/event-stream"));
    }

    @Test
    void streamExplanationWithInvalidRequestReturns400() throws Exception {
        String invalidPayload = """
                {
                  "context": {
                    "version": "9.9.9",
                    "scope": "invalid"
                  }
                }
                """;

        mockMvc.perform(post("/api/v1/ai/explanations/stream")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void streamExplanationWithMockExecutorReturns200AndSseEvents() throws Exception {
        doAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Consumer<AiStreamEventDto> consumer = invocation.getArgument(1);

            consumer.accept(new AiStreamEventDto("1.0.0", "stream-1", 1, "started", null, "2026-10-05T12:00:00Z"));
            consumer.accept(new AiStreamEventDto("1.0.0", "stream-1", 2, "chunk", "Savings rate healthy.", "2026-10-05T12:00:01Z"));
            consumer.accept(new AiStreamEventDto("1.0.0", "stream-1", 3, "completed", null, "2026-10-05T12:00:02Z"));

            return (AiStreamingExecutionHandle) () -> {};
        }).when(streamingExecutionPort).start(any(AiExecutionCommand.class), any());

        MvcResult result = mockMvc.perform(post("/api/v1/ai/explanations/stream")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PAYLOAD))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertTrue(responseBody.contains("event:started"));
        assertTrue(responseBody.contains("event:chunk"));
        assertTrue(responseBody.contains("Savings rate healthy."));
        assertTrue(responseBody.contains("event:completed"));
    }

    @Test
    void streamExplanationWithMockFailedTerminalEventEmitsFailedSseEvent() throws Exception {
        doAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Consumer<AiStreamEventDto> consumer = invocation.getArgument(1);

            consumer.accept(new AiStreamEventDto("1.0.0", "stream-1", 1, "started", null, "2026-10-05T12:00:00Z"));
            consumer.accept(new AiStreamEventDto("1.0.0", "stream-1", 2, "failed", "Provider timeout", "2026-10-05T12:00:01Z"));

            return (AiStreamingExecutionHandle) () -> {};
        }).when(streamingExecutionPort).start(any(AiExecutionCommand.class), any());

        MvcResult result = mockMvc.perform(post("/api/v1/ai/explanations/stream")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PAYLOAD))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertTrue(responseBody.contains("event:started"));
        assertTrue(responseBody.contains("event:failed"));
        assertTrue(responseBody.contains("Provider timeout"));
    }

    @Test
    void unversionedAndV2RoutesReturn404() throws Exception {
        mockMvc.perform(post("/api/ai/explanations/stream")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PAYLOAD))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v2/ai/explanations/stream")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PAYLOAD))
                .andExpect(status().isNotFound());
    }
}
