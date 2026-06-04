package com.portfolio.running.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "training_sessions")
public class TrainingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private TrainingWeek week;

    private LocalDate scheduledDate;

    @Enumerated(EnumType.STRING)
    private SessionType type;

    @Enumerated(EnumType.STRING)
    private SessionStatus status = SessionStatus.PLANNED;

    private String title;
    private Double targetDistanceKm;
    private Integer targetMinutes;
    private String intensity;

    @Column(length = 1000)
    private String coachNotes;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<WorkoutLog> logs = new ArrayList<>();
}
