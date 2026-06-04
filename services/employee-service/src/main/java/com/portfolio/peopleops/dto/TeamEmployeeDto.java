package com.portfolio.peopleops.dto;

import com.portfolio.peopleops.entity.EmployeeStatus;

public record TeamEmployeeDto(Long id, String fullName, String jobTitle, String departmentName, EmployeeStatus status,
        String email) {}
