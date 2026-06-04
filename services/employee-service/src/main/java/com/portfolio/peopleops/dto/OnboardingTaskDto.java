package com.portfolio.peopleops.dto;

import java.time.LocalDate;
import com.portfolio.peopleops.entity.OnboardingStatus;

public record OnboardingTaskDto(Long id, Long employeeId, String employeeName, String title,
        OnboardingStatus status, LocalDate dueDate, LocalDate completedDate) {}