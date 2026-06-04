package com.portfolio.gateway.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gateway")
public class GatewayInfoController {

    @GetMapping("/routes")
    public Map<String, String> routes() {
        return Map.of(
                "/api/auth/**", "auth-service",
                "/api/todos/**", "todo-service /api/todos",
                "/api/notifications/**", "notification-service /api/notifications",
                "/api/items/**", "shop-service /api/items",
                "/api/orders/**", "shop-service /api/orders",
                "/api/peopleops/**", "employee-service /api/peopleops",
                "/api/running/**", "running-coach-service /api/running",
                "/api/documents/**", "yomira-document-service /api/document",
                "/api/quizzes/**", "yomira-quiz-service /api/quiz"
        );
    }
}





