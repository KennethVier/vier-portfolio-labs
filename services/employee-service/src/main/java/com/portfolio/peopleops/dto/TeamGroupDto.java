package com.portfolio.peopleops.dto;

import java.util.List;
import com.portfolio.peopleops.entity.EmployeeStatus;

public record TeamGroupDto(Long managerId, String managerName, String jobTitle, String departmentName,
        EmployeeStatus status, long teamHeadcount, long activeCount, long onboardingCount, long onLeaveCount,
        List<TeamEmployeeDto> directReports) {}
