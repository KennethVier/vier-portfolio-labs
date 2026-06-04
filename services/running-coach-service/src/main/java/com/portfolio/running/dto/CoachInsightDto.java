package com.portfolio.running.dto;

import java.time.LocalDateTime;

public record CoachInsightDto(
        Long id,
        Long sessionId,
        Long workoutLogId,
        String feedback,
        String recoveryGuidance,
        String nextAdjustment,
        String safetyNote,
        boolean aiGenerated,
        LocalDateTime createdAt) {}
