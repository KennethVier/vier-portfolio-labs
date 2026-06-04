package com.portfolio.peopleops.dto;

import java.time.LocalDate;
import com.portfolio.peopleops.entity.LeaveStatus;
import com.portfolio.peopleops.entity.LeaveType;

public record LeaveRequestDto(Long id, Long employeeId, String employeeName, LeaveType type, LocalDate startDate,
        LocalDate endDate, String reason, LeaveStatus status, String reviewerNote, long commentCount) {}
