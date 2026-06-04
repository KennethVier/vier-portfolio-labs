package com.portfolio.running.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "workout_logs")
public class WorkoutLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private TrainingSession session;

    @Enumerated(EnumType.STRING)
    private WorkoutSource source = WorkoutSource.MANUAL;

    private Double distanceKm;
    private Integer durationMinutes;
    private String pace;
    private Integer perceivedEffort;
    private Integer fatigueLevel;
    private Integer painLevel;

    @Enumerated(EnumType.STRING)
    private SessionStatus completionStatus = SessionStatus.COMPLETED;

    @Column(length = 1200)
    private String notes;

    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
