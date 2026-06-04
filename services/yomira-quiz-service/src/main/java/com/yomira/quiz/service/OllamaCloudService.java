package com.yomira.quiz.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yomira.quiz.dto.OllamaRequest;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class OllamaCloudService {

    @Autowired
    @Qualifier("ollamaWebClient")
    WebClient webClient;

    @Value("${OLLAMA_API_KEY}")
    private String apiKey;

    public String generate(OllamaRequest request) {
        try {
            Map<String, Object> response = Map.of(
                "model", request.getModel(),
                "prompt", request.getPrompt(),
                "temperature", request.getTemperature(),
                "max_tokens", request.getMax_tokens(),
                "stream", false
            );
            String raw = webClient.post()
                    .uri("https://ollama.com/api/generate")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(response)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode json = new ObjectMapper().readTree(raw);
            return json.get("response").asText();

        } catch (Exception e) {
            log.error("Ollama Cloud API call failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate quiz via Ollama Cloud", e);
        }
    }

}
