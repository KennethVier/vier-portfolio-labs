package com.portfolio.peopleops.service;

import java.time.LocalDate;
import java.util.List;
import com.portfolio.peopleops.dto.*;

public interface PeopleOpsService {
    DashboardDto getDashboard();
    List<EmployeeDto> getEmployees(String search, String department, String status, String employmentType, String sort);
    EmployeeDto getEmployee(Long id);
    EmployeeDto createEmployee(EmployeeRequest request);
    EmployeeDto updateEmployee(Long id, EmployeeRequest request);
    List<DepartmentDto> getDepartments();
    DepartmentDto createDepartment(DepartmentRequest request);
    DepartmentDto updateDepartment(Long id, DepartmentRequest request);
    List<OnboardingTaskDto> getOnboardingTasks(Long employeeId);
    OnboardingTaskDto updateOnboardingTask(Long id, OnboardingUpdateRequest request);
    List<LeaveRequestDto> getLeaveRequests(String status, String type, Long employeeId);
    LeaveRequestDto createLeaveRequest(LeaveRequestCreateRequest request);
    LeaveRequestDto reviewLeaveRequest(Long id, LeaveReviewRequest request);
    List<LeaveRequestCommentDto> getLeaveRequestComments(Long leaveRequestId);
    LeaveRequestCommentDto createLeaveRequestComment(Long leaveRequestId, LeaveRequestCommentRequest request);
    List<ActivityLogDto> getActivity(String entityType, String actorName, String keyword, LocalDate fromDate, LocalDate toDate);
    List<ActivityLogDto> getEmployeeActivity(Long employeeId);
    TeamOverviewDto getTeamOverview();
}
