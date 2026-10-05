package com.vier.pesopilot.ai.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AiExplanationControllerProductionWiringTest {

    @Autowired
    private MockMvc mockMvc;

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
    void defaultProductionWiringFailsWith503ServiceUnavailable() throws Exception {
        mockMvc.perform(post("/api/v1/ai/explanations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PAYLOAD))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("AI execution service is currently unavailable"))
                .andExpect(jsonPath("$.data").value(nullValue()));
    }
}
