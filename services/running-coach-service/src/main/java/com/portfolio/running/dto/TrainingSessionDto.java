package com.portfolio.running.dto;

import java.time.LocalDate;

import com.portfolio.running.entity.SessionStatus;
import com.portfolio.running.entity.SessionType;

public record TrainingSessionDto(
        Long id,
        LocalDate scheduledDate,
        SessionType type,
        SessionStatus status,
        String title,
        Double targetDistanceKm,
        Integer targetMinutes,
        String intensity,
        String mainWorkout,
        String coachNotes) {}
