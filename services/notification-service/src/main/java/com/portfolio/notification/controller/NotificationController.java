package com.portfolio.notification.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portfolio.notification.dto.NotificationLogDto;
import com.portfolio.notification.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/check-deadlines")
    public List<NotificationLogDto> checkDeadlines() {
        return notificationService.checkTaskDeadlines();
    }

    @GetMapping("/logs")
    public List<NotificationLogDto> recentLogs() {
        return notificationService.getRecentLogs();
    }
}
