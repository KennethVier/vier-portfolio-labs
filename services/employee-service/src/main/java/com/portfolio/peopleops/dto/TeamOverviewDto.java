package com.portfolio.peopleops.dto;

import java.util.List;

public record TeamOverviewDto(List<TeamGroupDto> teams, List<TeamEmployeeDto> unassignedEmployees) {}
