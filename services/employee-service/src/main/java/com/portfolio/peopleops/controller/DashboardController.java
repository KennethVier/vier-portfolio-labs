package com.portfolio.peopleops.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.portfolio.peopleops.dto.DashboardDto;
import com.portfolio.peopleops.service.PeopleOpsService;

@RestController
@RequestMapping("/api/peopleops/dashboard")
public class DashboardController {
    private final PeopleOpsService service;

    public DashboardController(PeopleOpsService service) {
        this.service = service;
    }

    @GetMapping
    public DashboardDto dashboard() {
        return service.getDashboard();
    }
}