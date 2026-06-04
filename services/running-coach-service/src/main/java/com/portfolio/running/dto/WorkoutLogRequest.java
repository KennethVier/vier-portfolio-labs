package com.portfolio.running.dto;

import com.portfolio.running.entity.SessionStatus;
import com.portfolio.running.entity.WorkoutSource;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record WorkoutLogRequest(
        WorkoutSource source,
        @Min(0) Double distanceKm,
        @Min(0) Integer durationMinutes,
        String pace,
        @Min(1) @Max(10) Integer perceivedEffort,
        @Min(1) @Max(10) Integer fatigueLevel,
        @Min(0) @Max(10) Integer painLevel,
        SessionStatus completionStatus,
        String notes) {}
