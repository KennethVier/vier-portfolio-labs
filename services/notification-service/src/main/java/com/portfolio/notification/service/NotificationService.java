package com.portfolio.notification.service;

import java.util.List;

import com.portfolio.notification.dto.NotificationLogDto;

public interface NotificationService {
    List<NotificationLogDto> checkTaskDeadlines();
    List<NotificationLogDto> getRecentLogs();
}
