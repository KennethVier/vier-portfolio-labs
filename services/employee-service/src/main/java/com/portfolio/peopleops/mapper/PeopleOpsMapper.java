package com.portfolio.peopleops.mapper;

import java.util.List;
import com.portfolio.peopleops.dto.*;
import com.portfolio.peopleops.entity.*;

public final class PeopleOpsMapper {
    private PeopleOpsMapper() {}

    public static EmployeeDto toEmployeeDto(Employee employee) {
        return new EmployeeDto(employee.getId(), employee.getEmployeeNumber(), employee.getFirstName(), employee.getLastName(),
                employee.getEmail(), employee.getPhone(), employee.getJobTitle(), employee.getDepartment().getId(),
                employee.getDepartment().getName(), employee.getManager() == null ? null : employee.getManager().getId(),
                employee.getManager() == null ? null : fullName(employee.getManager()), employee.getStatus(),
                employee.getEmploymentType(), employee.getStartDate(), employee.getLocation());
    }

    public static DepartmentDto toDepartmentDto(Department department, List<Employee> employees) {
        long headcount = employees.stream().filter(employee -> employee.getDepartment().getId().equals(department.getId())).count();
        long activeCount = employees.stream().filter(employee -> employee.getDepartment().getId().equals(department.getId()) && employee.getStatus() == EmployeeStatus.ACTIVE).count();
        long onboardingCount = employees.stream().filter(employee -> employee.getDepartment().getId().equals(department.getId()) && employee.getStatus() == EmployeeStatus.ONBOARDING).count();
        return new DepartmentDto(department.getId(), department.getName(), department.getDescription(),
                department.getLeadEmployee() == null ? null : department.getLeadEmployee().getId(),
                department.getLeadEmployee() == null ? null : fullName(department.getLeadEmployee()), department.getLocation(),
                headcount, activeCount, onboardingCount);
    }

    public static OnboardingTaskDto toOnboardingTaskDto(OnboardingTask task) {
        return new OnboardingTaskDto(task.getId(), task.getEmployee().getId(), fullName(task.getEmployee()),
                task.getTitle(), task.getStatus(), task.getDueDate(), task.getCompletedDate());
    }

    public static LeaveRequestDto toLeaveRequestDto(LeaveRequest request) {
        return toLeaveRequestDto(request, 0);
    }

    public static LeaveRequestDto toLeaveRequestDto(LeaveRequest request, long commentCount) {
        return new LeaveRequestDto(request.getId(), request.getEmployee().getId(), fullName(request.getEmployee()),
                request.getType(), request.getStartDate(), request.getEndDate(), request.getReason(),
                request.getStatus(), request.getReviewerNote(), commentCount);
    }

    public static LeaveRequestCommentDto toLeaveRequestCommentDto(LeaveRequestComment comment) {
        return new LeaveRequestCommentDto(comment.getId(), comment.getLeaveRequest().getId(), comment.getAuthorName(),
                comment.getAuthorRole(), comment.getMessage(), comment.getCreatedAt());
    }

    public static TeamEmployeeDto toTeamEmployeeDto(Employee employee) {
        return new TeamEmployeeDto(employee.getId(), fullName(employee), employee.getJobTitle(),
                employee.getDepartment().getName(), employee.getStatus(), employee.getEmail());
    }

    public static ActivityLogDto toActivityLogDto(ActivityLog log) {
        return new ActivityLogDto(log.getId(), log.getActorName(), log.getAction(), log.getEntityType(), log.getEntityId(), log.getCreatedAt());
    }

    public static String fullName(Employee employee) {
        return employee.getFirstName() + " " + employee.getLastName();
    }
}
