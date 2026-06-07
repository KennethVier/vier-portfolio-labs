package com.portfolio.running.dto;

import java.time.LocalDate;
import java.util.List;

import com.portfolio.running.entity.PlanType;

public record TrainingPlanDto(
        Long id,
        String title,
        String coachSummary,
        String raceStrategy,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate raceDate,
        PlanType planType,
        boolean activePlan,
        boolean aiGenerated,
        List<TrainingWeekDto> weeks) {}


