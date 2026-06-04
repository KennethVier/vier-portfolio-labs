package com.portfolio.peopleops.dto;

import com.portfolio.peopleops.entity.LeaveStatus;
import jakarta.validation.constraints.NotNull;

public record LeaveReviewRequest(@NotNull LeaveStatus status, String reviewerNote) {}