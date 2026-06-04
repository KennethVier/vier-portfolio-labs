package com.portfolio.running.dto;

import java.time.LocalDate;
import java.util.List;

public record TrainingPlanDto(
        Long id,
        String title,
        String coachSummary,
        LocalDate startDate,
        LocalDate endDate,
        boolean activePlan,
        boolean aiGenerated,
        List<TrainingWeekDto> weeks) {}
