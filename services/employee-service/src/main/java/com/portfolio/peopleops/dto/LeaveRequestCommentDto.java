package com.portfolio.peopleops.dto;

import java.time.LocalDateTime;

public record LeaveRequestCommentDto(Long id, Long leaveRequestId, String authorName, String authorRole,
        String message, LocalDateTime createdAt) {}
