package com.portfolio.peopleops.dto;

import java.time.LocalDate;
import com.portfolio.peopleops.entity.EmployeeStatus;
import com.portfolio.peopleops.entity.EmploymentType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EmployeeRequest(@NotBlank String employeeNumber, @NotBlank String firstName, @NotBlank String lastName,
        @Email @NotBlank String email, String phone, @NotBlank String jobTitle, @NotNull Long departmentId,
        Long managerId, @NotNull EmployeeStatus status, @NotNull EmploymentType employmentType,
        LocalDate startDate, String location) {}