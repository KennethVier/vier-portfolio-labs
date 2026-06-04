package com.portfolio.running.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableConfigurationProperties(AiProperties.class)
public class AiConfig {
    @Bean
    WebClient ollamaWebClient(AiProperties properties) {
        return WebClient.builder()
                .baseUrl(properties.ollamaBaseUrl())
                .build();
    }
}
