package com.portfolio.notification.service.impl;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portfolio.notification.client.TodoServiceClient;
import com.portfolio.notification.dto.NotificationLogDto;
import com.portfolio.notification.dto.TaskDto;
import com.portfolio.notification.model.NotificationLog;
import com.portfolio.notification.model.NotificationType;
import com.portfolio.notification.repository.NotificationLogRepository;
import com.portfolio.notification.service.EmailService;
import com.portfolio.notification.service.NotificationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final String COMPLETED = "Completed";
    private static final String COMPLETED_BUT_OVERDUE = "Completed but Overdue";

    private final TodoServiceClient todoServiceClient;
    private final EmailService emailService;
    private final NotificationLogRepository notificationLogRepository;

    @Value("${platform.notifications.deadline-window-minutes:5}")
    private long deadlineWindowMinutes;

    @Override
    @Transactional
    public List<NotificationLogDto> checkTaskDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        List<NotificationLogDto> createdLogs = new ArrayList<>();

        for (TaskDto task : todoServiceClient.getAllTasks()) {
            if (!isOpenTask(task) || task.getEndDate() == null || task.getUserEmail() == null || task.getIdTask() == null) {
                continue;
            }

            maybeCreateNotification(task, NotificationType.DUE_IN_ONE_DAY, "Task Deadline Reminder",
                    "Reminder: The task \"" + task.getTitle() + "\" is due in 1 day.",
                    isDueIn(task.getEndDate(), now, ChronoUnit.DAYS, 1), createdLogs);

            maybeCreateNotification(task, NotificationType.DUE_IN_ONE_HOUR, "Task Deadline Reminder",
                    "Reminder: The task \"" + task.getTitle() + "\" is due in 1 hour.",
                    isDueIn(task.getEndDate(), now, ChronoUnit.HOURS, 1), createdLogs);

            maybeCreateNotification(task, NotificationType.DEADLINE_PASSED, "Task Deadline Passed",
                    "The task \"" + task.getTitle() + "\" was not completed within the time frame.",
                    isDeadlinePassed(task.getEndDate(), now), createdLogs);
        }

        return createdLogs;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationLogDto> getRecentLogs() {
        return notificationLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .toList();
    }

    private void maybeCreateNotification(
            TaskDto task,
            NotificationType type,
            String subject,
            String body,
            boolean shouldNotify,
            List<NotificationLogDto> createdLogs
    ) {
        if (!shouldNotify || notificationLogRepository.existsByTaskIdAndType(task.getIdTask(), type)) {
            return;
        }

        NotificationLog log = NotificationLog.builder()
                .taskId(task.getIdTask())
                .taskTitle(task.getTitle())
                .recipientEmail(task.getUserEmail())
                .type(type)
                .subject(subject)
                .body(body)
                .createdAt(LocalDateTime.now())
                .sent(false)
                .build();

        try {
            emailService.sendEmail(task.getUserEmail(), subject, body);
            log.setSent(true);
            log.setSentAt(LocalDateTime.now());
        } catch (RuntimeException exception) {
            log.setErrorMessage(exception.getMessage());
        }

        createdLogs.add(mapToDto(notificationLogRepository.save(log)));
    }

    private boolean isOpenTask(TaskDto task) {
        return !COMPLETED.equalsIgnoreCase(task.getStatus())
                && !COMPLETED_BUT_OVERDUE.equalsIgnoreCase(task.getStatus())
                && task.getCompletedDate() == null;
    }

    private boolean isDueIn(LocalDateTime endDate, LocalDateTime now, ChronoUnit unit, long amount) {
        long difference = unit.between(now, endDate);
        return difference == amount;
    }

    private boolean isDeadlinePassed(LocalDateTime endDate, LocalDateTime now) {
        return !now.isBefore(endDate) && now.isBefore(endDate.plusMinutes(deadlineWindowMinutes));
    }

    private NotificationLogDto mapToDto(NotificationLog log) {
        return NotificationLogDto.builder()
                .id(log.getId())
                .taskId(log.getTaskId())
                .taskTitle(log.getTaskTitle())
                .recipientEmail(log.getRecipientEmail())
                .type(log.getType())
                .subject(log.getSubject())
                .body(log.getBody())
                .sent(log.isSent())
                .errorMessage(log.getErrorMessage())
                .createdAt(log.getCreatedAt())
                .sentAt(log.getSentAt())
                .build();
    }
}
