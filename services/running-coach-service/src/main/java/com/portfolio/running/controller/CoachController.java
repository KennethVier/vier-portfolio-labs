package com.portfolio.running.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.portfolio.running.dto.CoachInsightDto;
import com.portfolio.running.service.RunningCoachService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/running")
@RequiredArgsConstructor
public class CoachController {
    private final RunningCoachService runningCoachService;

    @PostMapping("/coach/adjust-next-session")
    public CoachInsightDto adjustNextSession(@RequestParam String email) {
        return runningCoachService.adjustNextSession(email);
    }

    @GetMapping("/insights")
    public List<CoachInsightDto> insights(@RequestParam String email) {
        return runningCoachService.getInsights(email);
    }
}
