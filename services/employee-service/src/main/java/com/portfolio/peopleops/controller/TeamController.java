package com.portfolio.peopleops.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.portfolio.peopleops.dto.TeamOverviewDto;
import com.portfolio.peopleops.service.PeopleOpsService;

@RestController
@RequestMapping("/api/peopleops/team")
public class TeamController {
    private final PeopleOpsService service;

    public TeamController(PeopleOpsService service) {
        this.service = service;
    }

    @GetMapping
    public TeamOverviewDto team() {
        return service.getTeamOverview();
    }
}
