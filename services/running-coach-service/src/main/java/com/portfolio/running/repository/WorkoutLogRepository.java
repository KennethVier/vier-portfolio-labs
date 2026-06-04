package com.portfolio.running.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portfolio.running.entity.WorkoutLog;

public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, Long> {
    List<WorkoutLog> findBySessionWeekPlanRunnerEmailIgnoreCaseOrderByCreatedAtDesc(String email);
}
