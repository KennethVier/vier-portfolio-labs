package com.portfolio.running.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "training_weeks")
public class TrainingWeek {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private TrainingPlan plan;

    private Integer weekNumber;
    private String focus;
    private Double targetDistanceKm;

    @OneToMany(mappedBy = "week", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("scheduledDate ASC")
    private List<TrainingSession> sessions = new ArrayList<>();
}
