package com.portfolio.gateway.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class GatewayRoutesConfig {

    @Value("${platform.services.auth-url:http://localhost:8083}")
    private String authServiceUrl;

    @Value("${platform.services.todo-url:http://localhost:8084}")
    private String todoServiceUrl;

    @Value("${platform.services.notification-url:http://localhost:8085}")
    private String notificationServiceUrl;

    @Value("${platform.services.document-url:http://localhost:8081}")
    private String documentServiceUrl;

    @Value("${platform.services.quiz-url:http://localhost:8082}")
    private String quizServiceUrl;

    @Value("${platform.services.shop-url:http://localhost:8086}")
    private String shopServiceUrl;

    @Value("${platform.services.employee-url:http://localhost:8087}")
    private String employeeServiceUrl;

    @Value("${platform.cors.allowed-origin-patterns:http://localhost:*}")
    private List<String> allowedOriginPatterns;

    @Bean
    public RouteLocator platformRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth-oauth-route", route -> route
                        .path("/api/auth/oauth2/**")
                        .filters(filters -> filters.rewritePath("/api/auth/(?<segment>.*)", "/${segment}"))
                        .uri(authServiceUrl))
                .route("auth-route", route -> route
                        .path("/api/auth/**")
                        .filters(filters -> filters.rewritePath("/api/auth/?(?<segment>.*)", "/auth/${segment}"))
                        .uri(authServiceUrl))
                .route("todo-route", route -> route
                        .path("/api/todos", "/api/todos/**")
                        .uri(todoServiceUrl))
                .route("notifications-route", route -> route
                        .path("/api/notifications", "/api/notifications/**")
                        .uri(notificationServiceUrl))
                .route("shop-route", route -> route
                        .path("/api/items", "/api/items/**")
                        .uri(shopServiceUrl))
                .route("shop-orders-route", route -> route
                        .path("/api/orders", "/api/orders/**")
                        .uri(shopServiceUrl))
                .route("peopleops-route", route -> route
                        .path("/api/peopleops", "/api/peopleops/**")
                        .uri(employeeServiceUrl))
                .route("documents-route", route -> route
                        .path("/api/documents/**")
                        .filters(filters -> filters.rewritePath("/api/documents/?(?<segment>.*)", "/api/document/${segment}"))
                        .uri(documentServiceUrl))
                .route("quizzes-route", route -> route
                        .path("/api/quizzes/**")
                        .filters(filters -> filters.rewritePath("/api/quizzes/?(?<segment>.*)", "/api/quiz/${segment}"))
                        .uri(quizServiceUrl))
                .build();
    }

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowedOriginPatterns(allowedOriginPatterns);
        corsConfiguration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        corsConfiguration.setAllowedHeaders(List.of("*"));
        corsConfiguration.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        corsConfiguration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return new CorsWebFilter(source);
    }
}




