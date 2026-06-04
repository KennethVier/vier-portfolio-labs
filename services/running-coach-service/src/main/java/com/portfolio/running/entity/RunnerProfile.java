package com.portfolio.running.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "runner_profiles")
public class RunnerProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrainingGoal goal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RunnerLevel level;

    private Integer weeklyAvailability;
    private Double recentWeeklyDistanceKm;
    private String typicalPace;
    private String preferredRunDays;

    @Column(length = 1200)
    private String healthNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
