package com.portfolio.notification.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.portfolio.notification.service.NotificationService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class TaskDeadlineScheduler {

    private final NotificationService notificationService;

    @Scheduled(fixedRateString = "${platform.notifications.fixed-rate-ms:3600000}")
    public void checkTaskDeadlines() {
        notificationService.checkTaskDeadlines();
    }
}
