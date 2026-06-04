package com.portfolio.running.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portfolio.running.entity.SessionStatus;
import com.portfolio.running.entity.TrainingSession;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {
    Optional<TrainingSession> findFirstByWeekPlanRunnerEmailIgnoreCaseAndStatusAndScheduledDateGreaterThanEqualOrderByScheduledDateAsc(
            String email, SessionStatus status, LocalDate date);
}
