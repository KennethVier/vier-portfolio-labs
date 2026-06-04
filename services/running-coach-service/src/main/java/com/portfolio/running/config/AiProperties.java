package com.portfolio.running.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "stride.ai")
public record AiProperties(String ollamaBaseUrl, String ollamaApiKey, String planModel, String feedbackModel) {
    public boolean hasApiKey() {
        return ollamaApiKey != null && !ollamaApiKey.isBlank();
    }

    public String planModelOrDefault() {
        return planModel == null || planModel.isBlank() ? "gpt-oss:20b-cloud" : planModel;
    }

    public String feedbackModelOrDefault() {
        return feedbackModel == null || feedbackModel.isBlank() ? "gpt-oss:20b-cloud" : feedbackModel;
    }
}