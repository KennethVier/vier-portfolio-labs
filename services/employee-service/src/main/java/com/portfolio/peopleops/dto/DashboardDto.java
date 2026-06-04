package com.portfolio.peopleops.dto;

import java.util.List;

public record DashboardDto(long totalEmployees, long activeEmployees, long onboardingEmployees, long pendingLeaveRequests,
        List<DepartmentSummaryDto> departmentDistribution, OnboardingSummaryDto onboardingSummary,
        List<ActivityLogDto> recentActivity) {}