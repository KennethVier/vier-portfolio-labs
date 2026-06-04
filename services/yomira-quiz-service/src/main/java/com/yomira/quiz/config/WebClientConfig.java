package com.yomira.quiz.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean(name = "documentServClient")
    WebClient documentServClient() {
        return WebClient.builder()
                .baseUrl("https://yomira-document-service-production.up.railway.app/api/document")
                .build();
    }

    @Bean(name = "ollamaWebClient")
    @Primary
    WebClient ollamaWebClient() {
        return WebClient.builder()
                .baseUrl("https://ollama.com/api")
                .build();
    }

}
