package com.portfolio.peopleops.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.portfolio.peopleops.dto.DepartmentDto;
import com.portfolio.peopleops.dto.DepartmentRequest;
import com.portfolio.peopleops.service.PeopleOpsService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/peopleops/departments")
public class DepartmentController {
    private final PeopleOpsService service;

    public DepartmentController(PeopleOpsService service) {
        this.service = service;
    }

    @GetMapping
    public List<DepartmentDto> departments() {
        return service.getDepartments();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentDto create(@Valid @RequestBody DepartmentRequest request) {
        return service.createDepartment(request);
    }

    @PutMapping("/{id}")
    public DepartmentDto update(@PathVariable Long id, @Valid @RequestBody DepartmentRequest request) {
        return service.updateDepartment(id, request);
    }
}