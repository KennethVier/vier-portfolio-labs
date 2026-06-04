package com.portfolio.running.service;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.portfolio.running.config.AiProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class OllamaCoachClient {
    private final WebClient ollamaWebClient;
    private final AiProperties properties;

    public String generatePlan(String prompt) {
        return generate(prompt, properties.planModelOrDefault());
    }

    public String generateFeedback(String prompt) {
        return generate(prompt, properties.feedbackModelOrDefault());
    }

    private String generate(String prompt, String model) {
        if (!properties.hasApiKey()) {
            return null;
        }

        try {
            Map<String, Object> body = Map.of(
                    "model", model,
                    "prompt", prompt,
                    "temperature", 0.35,
                    "stream", false);

            Map<?, ?> response = ollamaWebClient.post()
                    .uri("/generate")
                    .header("Authorization", "Bearer " + properties.ollamaApiKey())
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            Object result = response == null ? null : response.get("response");
            return result == null ? null : result.toString().trim();
        } catch (Exception ex) {
            log.warn("StrideMate AI generation failed for model {}, using deterministic fallback: {}", model, ex.getMessage());
            return null;
        }
    }
}