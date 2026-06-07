package com.portfolio.running.dto;

import com.portfolio.running.entity.RunnerLevel;
import com.portfolio.running.entity.TrainingGoal;

public record RunnerProfileDto(
        Long id,
        String email,
        String name,
        TrainingGoal goal,
        String goalText,
        RunnerLevel level,
        Integer weeklyAvailability,
        Double recentWeeklyDistanceKm,
        String typicalPace,
        String preferredRunDays,
        String healthNotes) {}
