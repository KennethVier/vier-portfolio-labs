package com.portfolio.peopleops.dto;

import jakarta.validation.constraints.NotBlank;

public record DepartmentRequest(@NotBlank String name, String description, Long leadEmployeeId, String location) {}