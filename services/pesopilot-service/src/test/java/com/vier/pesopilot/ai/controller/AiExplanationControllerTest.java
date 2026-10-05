package com.vier.pesopilot.ai.controller;

import com.vier.pesopilot.ai.execution.AiExecutionCommand;
import com.vier.pesopilot.ai.execution.AiExecutionPort;
import com.vier.pesopilot.ai.execution.AiExecutionResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AiExplanationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AiExecutionPort executionPort;

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
    void postExplanationWithMockExecutorReturns200AndValidEnvelope() throws Exception {
        Instant now = Instant.parse("2026-10-05T12:00:00Z");
        when(executionPort.execute(any(AiExecutionCommand.class))).thenReturn(
                new AiExecutionResult("req-test-123", "Your financial position is stable.", now)
        );

        mockMvc.perform(post("/api/v1/ai/explanations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PAYLOAD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.requestId").value("req-test-123"))
                .andExpect(jsonPath("$.data.explanation").value("Your financial position is stable."))
                .andExpect(jsonPath("$.data.generatedAt").value(now.toString()));
    }

    @Test
    void postExplanationWithMissingContextReturns400() throws Exception {
        mockMvc.perform(post("/api/v1/ai/explanations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("context")));
    }

    @Test
    void postExplanationWithMalformedJsonReturns400() throws Exception {
        mockMvc.perform(post("/api/v1/ai/explanations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid request body"));
    }

    @Test
    void unversionedRouteReturns404() throws Exception {
        mockMvc.perform(post("/api/ai/explanations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void v2RouteReturns404() throws Exception {
        mockMvc.perform(post("/api/v2/ai/explanations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void postExplanationWithUnsupportedContextVersionReturns400() throws Exception {
        String badVersionPayload = VALID_PAYLOAD.replace("\"version\": \"1.0.0\"", "\"version\": \"2.0.0\"");
        mockMvc.perform(post("/api/v1/ai/explanations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badVersionPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unsupported context version"));
    }

    @Test
    void postExplanationWithUnsupportedConversationContextVersionReturns400() throws Exception {
        String payloadWithBadConv = VALID_PAYLOAD.replace(
                "\"insights\": {",
                "\"conversationContext\": { \"version\": \"2.0.0\", \"topic\": { \"current\": \"general\" } }, \"insights\": {"
        );
        mockMvc.perform(post("/api/v1/ai/explanations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithBadConv))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unsupported conversation context version"));
    }

    @Test
    void postExplanationWithUnsupportedMemoryContextVersionReturns400() throws Exception {
        String payloadWithBadMem = VALID_PAYLOAD.replace(
                "\"insights\": {",
                "\"memoryContext\": { \"version\": \"2.0.0\", \"items\": [] }, \"insights\": {"
        );
        mockMvc.perform(post("/api/v1/ai/explanations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithBadMem))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unsupported memory context version"));
    }

    @Test
    void responseDoesNotContainSensitiveInternalDetailsOrStackTrace() throws Exception {
        mockMvc.perform(post("/api/v1/ai/explanations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", not(containsString("org.springframework"))))
                .andExpect(jsonPath("$.message", not(containsString("com.vier"))))
                .andExpect(jsonPath("$.data").doesNotExist());
    }
}
