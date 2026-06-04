package com.authenticaton.service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AppConfig {

    @Value("${platform.cors.allowed-origins:http://localhost:5173}")
    private String[] allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
           @Override
           public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
               registry.addMapping("/**")
                       .allowedOrigins(allowedOrigins)
                       .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                       .allowedHeaders("*")
                       .allowCredentials(true);
           }
        };
    }
}
