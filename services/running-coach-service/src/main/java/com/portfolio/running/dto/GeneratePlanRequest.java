package com.portfolio.running.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record GeneratePlanRequest(@Email @NotBlank String email, LocalDate startDate) {}
