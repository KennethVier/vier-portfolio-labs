package com.portfolio.peopleops.dto;

import java.time.LocalDate;
import com.portfolio.peopleops.entity.EmployeeStatus;
import com.portfolio.peopleops.entity.EmploymentType;

public record EmployeeDto(Long id, String employeeNumber, String firstName, String lastName, String email, String phone,
        String jobTitle, Long departmentId, String departmentName, Long managerId, String managerName,
        EmployeeStatus status, EmploymentType employmentType, LocalDate startDate, String location) {}