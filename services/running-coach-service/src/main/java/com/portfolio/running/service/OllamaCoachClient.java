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

    public String planModelName() {
        return properties.planModelOrDefault();
    }

    public String generateFeedback(String prompt) {
        return generate(prompt, properties.feedbackModelOrDefault());
    }

    private String generate(String prompt, String model) {
        if (!properties.hasApiKey()) {
            log.warn("StrideMate AI generation skipped for model {} because no API key is configured", model);
            return null;
        }

        long startedAt = System.nanoTime();
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
            String generated = result == null ? null : result.toString().trim();
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("StrideMate AI generation completed model={} promptChars={} responseChars={} elapsedMs={}",
                    model, prompt == null ? 0 : prompt.length(), generated == null ? 0 : generated.length(), elapsedMs);
            return generated;
        } catch (Exception ex) {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.warn("StrideMate AI generation failed model={} promptChars={} elapsedMs={} fallback=deterministic reason={}",
                    model, prompt == null ? 0 : prompt.length(), elapsedMs, ex.getMessage());
            return null;
        }
    }
}
