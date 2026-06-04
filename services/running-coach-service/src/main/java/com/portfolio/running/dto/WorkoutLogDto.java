package com.portfolio.running.dto;

import java.time.LocalDateTime;

import com.portfolio.running.entity.SessionStatus;
import com.portfolio.running.entity.WorkoutSource;

public record WorkoutLogDto(
        Long id,
        Long sessionId,
        WorkoutSource source,
        Double distanceKm,
        Integer durationMinutes,
        String pace,
        Integer perceivedEffort,
        Integer fatigueLevel,
        Integer painLevel,
        SessionStatus completionStatus,
        String notes,
        LocalDateTime createdAt,
        CoachInsightDto coachInsight) {}
