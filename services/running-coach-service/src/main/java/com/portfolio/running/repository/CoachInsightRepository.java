package com.portfolio.running.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portfolio.running.entity.CoachInsight;

public interface CoachInsightRepository extends JpaRepository<CoachInsight, Long> {
    List<CoachInsight> findTop8ByRunnerEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    List<CoachInsight> findByRunnerEmailIgnoreCaseOrderByCreatedAtDesc(String email);
}
