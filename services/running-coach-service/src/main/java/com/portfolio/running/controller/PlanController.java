package com.portfolio.running.controller;

import org.springframework.web.bind.annotation.*;

import com.portfolio.running.dto.GeneratePlanRequest;
import com.portfolio.running.dto.TrainingPlanDto;
import com.portfolio.running.service.RunningCoachService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/running/plans")
@RequiredArgsConstructor
public class PlanController {
    private final RunningCoachService runningCoachService;

    @PostMapping("/generate")
    public TrainingPlanDto generate(@Valid @RequestBody GeneratePlanRequest request) {
        return runningCoachService.generatePlan(request);
    }

    @GetMapping("/current")
    public TrainingPlanDto current(@RequestParam String email) {
        return runningCoachService.getCurrentPlan(email);
    }
}
