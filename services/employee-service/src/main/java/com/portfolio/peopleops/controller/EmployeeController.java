package com.portfolio.peopleops.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.portfolio.peopleops.dto.*;
import com.portfolio.peopleops.service.PeopleOpsService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/peopleops/employees")
public class EmployeeController {
    private final PeopleOpsService service;

    public EmployeeController(PeopleOpsService service) {
        this.service = service;
    }

    @GetMapping
    public List<EmployeeDto> employees(@RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String employmentType,
            @RequestParam(required = false) String sort) {
        return service.getEmployees(search, department, status, employmentType, sort);
    }

    @GetMapping("/{id}")
    public EmployeeDto employee(@PathVariable Long id) {
        return service.getEmployee(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmployeeDto create(@Valid @RequestBody EmployeeRequest request) {
        return service.createEmployee(request);
    }

    @PutMapping("/{id}")
    public EmployeeDto update(@PathVariable Long id, @Valid @RequestBody EmployeeRequest request) {
        return service.updateEmployee(id, request);
    }

    @GetMapping("/{id}/onboarding")
    public List<OnboardingTaskDto> onboarding(@PathVariable Long id) {
        return service.getOnboardingTasks(id);
    }

    @GetMapping("/{id}/activity")
    public List<ActivityLogDto> activity(@PathVariable Long id) {
        return service.getEmployeeActivity(id);
    }
}