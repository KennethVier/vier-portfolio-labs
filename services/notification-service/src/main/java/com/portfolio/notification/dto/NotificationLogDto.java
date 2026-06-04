package com.portfolio.notification.dto;

import java.time.LocalDateTime;

import com.portfolio.notification.model.NotificationType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationLogDto {
    private Long id;
    private String taskId;
    private String taskTitle;
    private String recipientEmail;
    private NotificationType type;
    private String subject;
    private String body;
    private boolean sent;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
}
