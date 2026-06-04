package com.portfolio.peopleops.dto;

public record DepartmentDto(Long id, String name, String description, Long leadEmployeeId, String leadEmployeeName,
        String location, long headcount, long activeCount, long onboardingCount) {}