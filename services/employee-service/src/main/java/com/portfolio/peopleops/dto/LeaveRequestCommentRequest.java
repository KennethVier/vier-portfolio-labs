package com.portfolio.peopleops.dto;

import jakarta.validation.constraints.NotBlank;

public record LeaveRequestCommentRequest(@NotBlank String authorName, @NotBlank String authorRole,
        @NotBlank String message) {}
