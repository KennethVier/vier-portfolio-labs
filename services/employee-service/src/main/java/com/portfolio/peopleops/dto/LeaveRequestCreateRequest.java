package com.portfolio.peopleops.dto;

import java.time.LocalDate;
import com.portfolio.peopleops.entity.LeaveType;
import jakarta.validation.constraints.NotNull;

public record LeaveRequestCreateRequest(@NotNull Long employeeId, @NotNull LeaveType type, @NotNull LocalDate startDate,
        @NotNull LocalDate endDate, String reason) {}