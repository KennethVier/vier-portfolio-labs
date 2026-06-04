package com.portfolio.running.controller;

import org.springframework.web.bind.annotation.*;

import com.portfolio.running.dto.RunnerProfileDto;
import com.portfolio.running.dto.RunnerProfileRequest;
import com.portfolio.running.service.RunningCoachService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/running/profiles")
@RequiredArgsConstructor
public class ProfileController {
    private final RunningCoachService runningCoachService;

    @PostMapping
    public RunnerProfileDto saveProfile(@Valid @RequestBody RunnerProfileRequest request) {
        return runningCoachService.saveProfile(request);
    }

    @GetMapping("/by-email")
    public RunnerProfileDto getByEmail(@RequestParam String email) {
        return runningCoachService.getProfileByEmail(email);
    }
}
