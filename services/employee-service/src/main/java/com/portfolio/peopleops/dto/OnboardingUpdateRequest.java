package com.portfolio.peopleops.dto;

import com.portfolio.peopleops.entity.OnboardingStatus;
import jakarta.validation.constraints.NotNull;

public record OnboardingUpdateRequest(@NotNull OnboardingStatus status) {}