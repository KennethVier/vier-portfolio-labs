package com.vier.pesopilot.ai.config;

import com.vier.pesopilot.ai.gateway.RequestIdGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.UUID;

@Configuration
public class AiConfig {

    @Bean
    public RequestIdGenerator requestIdGenerator() {
        return () -> UUID.randomUUID().toString();
    }
}
