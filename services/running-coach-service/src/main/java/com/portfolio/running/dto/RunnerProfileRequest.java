package com.portfolio.running.dto;

import com.portfolio.running.entity.RunnerLevel;
import com.portfolio.running.entity.TrainingGoal;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RunnerProfileRequest(
        @Email @NotBlank String email,
        @NotBlank String name,
        TrainingGoal goal,
        @Size(max = 280) String goalText,
        @NotNull RunnerLevel level,
        @Min(1) @Max(7) Integer weeklyAvailability,
        @Min(0) Double recentWeeklyDistanceKm,
        String typicalPace,
        String preferredRunDays,
        String healthNotes) {}
