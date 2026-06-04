package com.portfolio.running.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.portfolio.running.dto.DashboardDto;
import com.portfolio.running.service.RunningCoachService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/running/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final RunningCoachService runningCoachService;

    @GetMapping
    public DashboardDto dashboard(@RequestParam String email) {
        return runningCoachService.getDashboard(email);
    }
}
