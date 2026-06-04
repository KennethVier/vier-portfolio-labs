package com.portfolio.running.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.portfolio.running.entity.RunnerProfile;
import com.portfolio.running.entity.TrainingPlan;

public interface TrainingPlanRepository extends JpaRepository<TrainingPlan, Long> {
    @EntityGraph(attributePaths = {"weeks", "weeks.sessions"})
    Optional<TrainingPlan> findFirstByRunnerAndActivePlanTrueOrderByCreatedAtDesc(RunnerProfile runner);
}
