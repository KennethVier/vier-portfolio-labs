package com.portfolio.notification.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portfolio.notification.model.NotificationLog;
import com.portfolio.notification.model.NotificationType;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    boolean existsByTaskIdAndType(String taskId, NotificationType type);
    List<NotificationLog> findTop50ByOrderByCreatedAtDesc();
}
