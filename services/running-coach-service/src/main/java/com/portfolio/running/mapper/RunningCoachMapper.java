package com.portfolio.running.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.portfolio.running.dto.*;
import com.portfolio.running.entity.*;

@Component
public class RunningCoachMapper {
    public RunnerProfileDto toProfileDto(RunnerProfile profile) {
        return new RunnerProfileDto(profile.getId(), profile.getEmail(), profile.getName(), profile.getGoal(), profile.getLevel(),
                profile.getWeeklyAvailability(), profile.getRecentWeeklyDistanceKm(), profile.getTypicalPace(),
                profile.getPreferredRunDays(), profile.getHealthNotes());
    }

    public TrainingPlanDto toPlanDto(TrainingPlan plan) {
        List<TrainingWeekDto> weeks = plan.getWeeks().stream().map(this::toWeekDto).toList();
        return new TrainingPlanDto(plan.getId(), plan.getTitle(), plan.getCoachSummary(), plan.getStartDate(), plan.getEndDate(),
                plan.isActivePlan(), plan.isAiGenerated(), weeks);
    }

    public TrainingWeekDto toWeekDto(TrainingWeek week) {
        return new TrainingWeekDto(week.getId(), week.getWeekNumber(), week.getFocus(), week.getTargetDistanceKm(),
                week.getSessions().stream().map(this::toSessionDto).toList());
    }

    public TrainingSessionDto toSessionDto(TrainingSession session) {
        return new TrainingSessionDto(session.getId(), session.getScheduledDate(), session.getType(), session.getStatus(),
                session.getTitle(), session.getTargetDistanceKm(), session.getTargetMinutes(), session.getIntensity(), session.getCoachNotes());
    }

    public WorkoutLogDto toWorkoutLogDto(WorkoutLog log, CoachInsight insight) {
        return new WorkoutLogDto(log.getId(), log.getSession().getId(), log.getSource(), log.getDistanceKm(), log.getDurationMinutes(),
                log.getPace(), log.getPerceivedEffort(), log.getFatigueLevel(), log.getPainLevel(), log.getCompletionStatus(),
                log.getNotes(), log.getCreatedAt(), insight == null ? null : toInsightDto(insight));
    }

    public CoachInsightDto toInsightDto(CoachInsight insight) {
        return new CoachInsightDto(insight.getId(),
                insight.getSession() == null ? null : insight.getSession().getId(),
                insight.getWorkoutLog() == null ? null : insight.getWorkoutLog().getId(),
                insight.getFeedback(), insight.getRecoveryGuidance(), insight.getNextAdjustment(), insight.getSafetyNote(),
                insight.isAiGenerated(), insight.getCreatedAt());
    }
}
