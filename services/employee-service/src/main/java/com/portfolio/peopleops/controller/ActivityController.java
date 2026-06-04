package com.portfolio.peopleops.controller;

import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.portfolio.peopleops.dto.ActivityLogDto;
import com.portfolio.peopleops.service.PeopleOpsService;

@RestController
@RequestMapping("/api/peopleops/activity")
public class ActivityController {
    private final PeopleOpsService service;

    public ActivityController(PeopleOpsService service) {
        this.service = service;
    }

    @GetMapping
    public List<ActivityLogDto> activity(@RequestParam(required = false) String entityType,
            @RequestParam(required = false) String actorName,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return service.getActivity(entityType, actorName, keyword, fromDate, toDate);
    }
}
