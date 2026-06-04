package com.portfolio.running.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "coach_insights")
public class CoachInsight {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private RunnerProfile runner;

    @ManyToOne
    private TrainingSession session;

    @ManyToOne
    private WorkoutLog workoutLog;

    @Column(nullable = false, length = 1200)
    private String feedback;

    @Column(length = 1200)
    private String recoveryGuidance;

    @Column(length = 1200)
    private String nextAdjustment;

    @Column(length = 1200)
    private String safetyNote;

    private boolean aiGenerated;
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
