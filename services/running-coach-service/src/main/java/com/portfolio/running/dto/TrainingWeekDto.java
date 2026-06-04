package com.portfolio.running.dto;

import java.util.List;

public record TrainingWeekDto(
        Long id,
        Integer weekNumber,
        String focus,
        Double targetDistanceKm,
        List<TrainingSessionDto> sessions) {}
