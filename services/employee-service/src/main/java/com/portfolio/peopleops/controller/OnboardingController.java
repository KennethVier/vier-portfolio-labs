package com.portfolio.peopleops.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.portfolio.peopleops.dto.OnboardingTaskDto;
import com.portfolio.peopleops.dto.OnboardingUpdateRequest;
import com.portfolio.peopleops.service.PeopleOpsService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/peopleops/onboarding")
public class OnboardingController {
    private final PeopleOpsService service;

    public OnboardingController(PeopleOpsService service) {
        this.service = service;
    }

    @GetMapping
    public List<OnboardingTaskDto> tasks(@RequestParam(required = false) Long employeeId) {
        return service.getOnboardingTasks(employeeId);
    }

    @PutMapping("/{id}")
    public OnboardingTaskDto update(@PathVariable Long id, @Valid @RequestBody OnboardingUpdateRequest request) {
        return service.updateOnboardingTask(id, request);
    }
}