package com.portfolio.running.controller;

import org.springframework.web.bind.annotation.*;

import com.portfolio.running.dto.TrainingSessionDto;
import com.portfolio.running.dto.WorkoutLogDto;
import com.portfolio.running.dto.WorkoutLogRequest;
import com.portfolio.running.service.RunningCoachService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/running/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final RunningCoachService runningCoachService;

    @GetMapping("/{id}")
    public TrainingSessionDto getSession(@PathVariable Long id) {
        return runningCoachService.getSession(id);
    }

    @PostMapping("/{id}/logs")
    public WorkoutLogDto logWorkout(@PathVariable Long id, @Valid @RequestBody WorkoutLogRequest request) {
        return runningCoachService.logWorkout(id, request);
    }
}
