package com.portfolio.peopleops.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.portfolio.peopleops.dto.*;
import com.portfolio.peopleops.entity.*;
import com.portfolio.peopleops.exception.ResourceNotFoundException;
import com.portfolio.peopleops.mapper.PeopleOpsMapper;
import com.portfolio.peopleops.repository.*;
import com.portfolio.peopleops.service.PeopleOpsService;

@Service
@Transactional
public class PeopleOpsServiceImpl implements PeopleOpsService {
    private static final String SYSTEM_ACTOR = "PeopleOps Admin";
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final OnboardingTaskRepository onboardingTaskRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveRequestCommentRepository leaveRequestCommentRepository;
    private final ActivityLogRepository activityLogRepository;

    public PeopleOpsServiceImpl(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository,
            OnboardingTaskRepository onboardingTaskRepository, LeaveRequestRepository leaveRequestRepository,
            LeaveRequestCommentRepository leaveRequestCommentRepository, ActivityLogRepository activityLogRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.onboardingTaskRepository = onboardingTaskRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveRequestCommentRepository = leaveRequestCommentRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardDto getDashboard() {
        List<Employee> employees = employeeRepository.findAll();
        List<OnboardingTask> tasks = onboardingTaskRepository.findAll();
        long active = employees.stream().filter(employee -> employee.getStatus() == EmployeeStatus.ACTIVE).count();
        long onboarding = employees.stream().filter(employee -> employee.getStatus() == EmployeeStatus.ONBOARDING).count();
        long pendingRequests = leaveRequestRepository.findAll().stream().filter(request -> request.getStatus() == LeaveStatus.PENDING).count();
        List<DepartmentSummaryDto> distribution = departmentRepository.findAll().stream()
                .map(department -> new DepartmentSummaryDto(department.getName(), employees.stream().filter(employee -> employee.getDepartment().getId().equals(department.getId())).count()))
                .toList();
        OnboardingSummaryDto onboardingSummary = new OnboardingSummaryDto(
                tasks.stream().filter(task -> task.getStatus() == OnboardingStatus.TODO).count(),
                tasks.stream().filter(task -> task.getStatus() == OnboardingStatus.IN_PROGRESS).count(),
                tasks.stream().filter(task -> task.getStatus() == OnboardingStatus.DONE).count());
        return new DashboardDto(employees.size(), active, onboarding, pendingRequests, distribution, onboardingSummary,
                activityLogRepository.findTop8ByOrderByCreatedAtDesc().stream().map(PeopleOpsMapper::toActivityLogDto).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeDto> getEmployees(String search, String department, String status, String employmentType, String sort) {
        return employeeRepository.findAll().stream()
                .filter(employee -> matchesSearch(employee, search))
                .filter(employee -> department == null || department.isBlank() || employee.getDepartment().getName().equalsIgnoreCase(department))
                .filter(employee -> status == null || status.isBlank() || employee.getStatus().name().equalsIgnoreCase(status))
                .filter(employee -> employmentType == null || employmentType.isBlank() || employee.getEmploymentType().name().equalsIgnoreCase(employmentType))
                .sorted(comparator(sort))
                .map(PeopleOpsMapper::toEmployeeDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeDto getEmployee(Long id) {
        return PeopleOpsMapper.toEmployeeDto(findEmployee(id));
    }

    @Override
    public EmployeeDto createEmployee(EmployeeRequest request) {
        Employee employee = new Employee();
        applyEmployee(employee, request);
        Employee saved = employeeRepository.save(employee);
        log(SYSTEM_ACTOR, "Added " + PeopleOpsMapper.fullName(saved), "EMPLOYEE", saved.getId());
        createDefaultOnboardingTasks(saved);
        return PeopleOpsMapper.toEmployeeDto(saved);
    }

    @Override
    public EmployeeDto updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = findEmployee(id);
        applyEmployee(employee, request);
        Employee saved = employeeRepository.save(employee);
        log(SYSTEM_ACTOR, "Updated " + PeopleOpsMapper.fullName(saved), "EMPLOYEE", saved.getId());
        return PeopleOpsMapper.toEmployeeDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDto> getDepartments() {
        List<Employee> employees = employeeRepository.findAll();
        return departmentRepository.findAll().stream().map(department -> PeopleOpsMapper.toDepartmentDto(department, employees)).toList();
    }

    @Override
    public DepartmentDto createDepartment(DepartmentRequest request) {
        Department department = new Department();
        applyDepartment(department, request);
        Department saved = departmentRepository.save(department);
        log(SYSTEM_ACTOR, "Created department " + saved.getName(), "DEPARTMENT", saved.getId());
        return PeopleOpsMapper.toDepartmentDto(saved, employeeRepository.findAll());
    }

    @Override
    public DepartmentDto updateDepartment(Long id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
        applyDepartment(department, request);
        Department saved = departmentRepository.save(department);
        log(SYSTEM_ACTOR, "Updated department " + saved.getName(), "DEPARTMENT", saved.getId());
        return PeopleOpsMapper.toDepartmentDto(saved, employeeRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OnboardingTaskDto> getOnboardingTasks(Long employeeId) {
        if (employeeId == null) return onboardingTaskRepository.findAll().stream().map(PeopleOpsMapper::toOnboardingTaskDto).toList();
        return onboardingTaskRepository.findByEmployeeId(employeeId).stream().map(PeopleOpsMapper::toOnboardingTaskDto).toList();
    }

    @Override
    public OnboardingTaskDto updateOnboardingTask(Long id, OnboardingUpdateRequest request) {
        OnboardingTask task = onboardingTaskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Onboarding task not found: " + id));
        task.setStatus(request.status());
        task.setCompletedDate(request.status() == OnboardingStatus.DONE ? LocalDate.now() : null);
        OnboardingTask saved = onboardingTaskRepository.save(task);
        log(SYSTEM_ACTOR, "Updated onboarding task for " + PeopleOpsMapper.fullName(saved.getEmployee()), "ONBOARDING", saved.getId());
        return PeopleOpsMapper.toOnboardingTaskDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveRequestDto> getLeaveRequests(String status, String type, Long employeeId) {
        return leaveRequestRepository.findAll().stream()
                .filter(request -> status == null || status.isBlank() || request.getStatus().name().equalsIgnoreCase(status))
                .filter(request -> type == null || type.isBlank() || request.getType().name().equalsIgnoreCase(type))
                .filter(request -> employeeId == null || request.getEmployee().getId().equals(employeeId))
                .sorted(Comparator.comparing(LeaveRequest::getStartDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(request -> PeopleOpsMapper.toLeaveRequestDto(request, leaveRequestCommentRepository.countByLeaveRequestId(request.getId())))
                .toList();
    }

    @Override
    public LeaveRequestDto createLeaveRequest(LeaveRequestCreateRequest request) {
        Employee employee = findEmployee(request.employeeId());
        LeaveRequest leave = new LeaveRequest();
        leave.setEmployee(employee);
        leave.setType(request.type());
        leave.setStartDate(request.startDate());
        leave.setEndDate(request.endDate());
        leave.setReason(request.reason());
        leave.setStatus(LeaveStatus.PENDING);
        LeaveRequest saved = leaveRequestRepository.save(leave);
        log(PeopleOpsMapper.fullName(employee), "Submitted " + request.type().name().toLowerCase(Locale.ROOT).replace('_', ' ') + " request", "LEAVE_REQUEST", saved.getId());
        return PeopleOpsMapper.toLeaveRequestDto(saved, 0);
    }

    @Override
    public LeaveRequestDto reviewLeaveRequest(Long id, LeaveReviewRequest request) {
        LeaveRequest leave = findLeaveRequest(id);
        leave.setStatus(request.status());
        leave.setReviewerNote(request.reviewerNote());
        if (request.status() == LeaveStatus.APPROVED) {
            leave.getEmployee().setStatus(EmployeeStatus.ON_LEAVE);
        }
        LeaveRequest saved = leaveRequestRepository.save(leave);
        log(SYSTEM_ACTOR, request.status().name().toLowerCase(Locale.ROOT) + " leave request for " + PeopleOpsMapper.fullName(saved.getEmployee()), "LEAVE_REQUEST", saved.getId());
        return PeopleOpsMapper.toLeaveRequestDto(saved, leaveRequestCommentRepository.countByLeaveRequestId(saved.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveRequestCommentDto> getLeaveRequestComments(Long leaveRequestId) {
        findLeaveRequest(leaveRequestId);
        return leaveRequestCommentRepository.findByLeaveRequestIdOrderByCreatedAtAsc(leaveRequestId).stream()
                .map(PeopleOpsMapper::toLeaveRequestCommentDto)
                .toList();
    }

    @Override
    public LeaveRequestCommentDto createLeaveRequestComment(Long leaveRequestId, LeaveRequestCommentRequest request) {
        LeaveRequest leaveRequest = findLeaveRequest(leaveRequestId);
        LeaveRequestComment comment = new LeaveRequestComment();
        comment.setLeaveRequest(leaveRequest);
        comment.setAuthorName(request.authorName());
        comment.setAuthorRole(request.authorRole());
        comment.setMessage(request.message());
        comment.setCreatedAt(LocalDateTime.now());
        LeaveRequestComment saved = leaveRequestCommentRepository.save(comment);
        log(request.authorName(), "Commented on leave request for " + PeopleOpsMapper.fullName(leaveRequest.getEmployee()), "LEAVE_REQUEST", leaveRequest.getId());
        return PeopleOpsMapper.toLeaveRequestCommentDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLogDto> getActivity(String entityType, String actorName, String keyword, LocalDate fromDate, LocalDate toDate) {
        LocalDateTime from = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime to = toDate == null ? null : toDate.atTime(LocalTime.MAX);
        return activityLogRepository.findAll().stream()
                .filter(log -> entityType == null || entityType.isBlank() || log.getEntityType().equalsIgnoreCase(entityType))
                .filter(log -> actorName == null || actorName.isBlank() || log.getActorName().toLowerCase(Locale.ROOT).contains(actorName.toLowerCase(Locale.ROOT)))
                .filter(log -> keyword == null || keyword.isBlank() || log.getAction().toLowerCase(Locale.ROOT).contains(keyword.toLowerCase(Locale.ROOT)))
                .filter(log -> from == null || !log.getCreatedAt().isBefore(from))
                .filter(log -> to == null || !log.getCreatedAt().isAfter(to))
                .sorted(Comparator.comparing(ActivityLog::getCreatedAt).reversed())
                .map(PeopleOpsMapper::toActivityLogDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLogDto> getEmployeeActivity(Long employeeId) {
        return activityLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("EMPLOYEE", employeeId).stream()
                .map(PeopleOpsMapper::toActivityLogDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TeamOverviewDto getTeamOverview() {
        List<Employee> employees = employeeRepository.findAll();
        List<TeamGroupDto> teams = employees.stream()
                .filter(manager -> employees.stream().anyMatch(employee -> employee.getManager() != null && employee.getManager().getId().equals(manager.getId())))
                .sorted(Comparator.comparing(Employee::getFirstName).thenComparing(Employee::getLastName))
                .map(manager -> toTeamGroup(manager, employees.stream()
                        .filter(employee -> employee.getManager() != null && employee.getManager().getId().equals(manager.getId()))
                        .sorted(Comparator.comparing(Employee::getFirstName).thenComparing(Employee::getLastName))
                        .toList()))
                .toList();
        List<TeamEmployeeDto> unassigned = employees.stream()
                .filter(employee -> employee.getManager() == null)
                .sorted(Comparator.comparing(Employee::getFirstName).thenComparing(Employee::getLastName))
                .map(PeopleOpsMapper::toTeamEmployeeDto)
                .toList();
        return new TeamOverviewDto(teams, unassigned);
    }

    private TeamGroupDto toTeamGroup(Employee manager, List<Employee> directReports) {
        return new TeamGroupDto(manager.getId(), PeopleOpsMapper.fullName(manager), manager.getJobTitle(),
                manager.getDepartment().getName(), manager.getStatus(), directReports.size(),
                directReports.stream().filter(employee -> employee.getStatus() == EmployeeStatus.ACTIVE).count(),
                directReports.stream().filter(employee -> employee.getStatus() == EmployeeStatus.ONBOARDING).count(),
                directReports.stream().filter(employee -> employee.getStatus() == EmployeeStatus.ON_LEAVE).count(),
                directReports.stream().map(PeopleOpsMapper::toTeamEmployeeDto).toList());
    }

    private void applyEmployee(Employee employee, EmployeeRequest request) {
        employee.setEmployeeNumber(request.employeeNumber());
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setEmail(request.email());
        employee.setPhone(request.phone());
        employee.setJobTitle(request.jobTitle());
        employee.setDepartment(departmentRepository.findById(request.departmentId()).orElseThrow(() -> new ResourceNotFoundException("Department not found: " + request.departmentId())));
        employee.setManager(request.managerId() == null ? null : findEmployee(request.managerId()));
        employee.setStatus(request.status());
        employee.setEmploymentType(request.employmentType());
        employee.setStartDate(request.startDate());
        employee.setLocation(request.location());
    }

    private void applyDepartment(Department department, DepartmentRequest request) {
        department.setName(request.name());
        department.setDescription(request.description());
        department.setLocation(request.location());
        department.setLeadEmployee(request.leadEmployeeId() == null ? null : findEmployee(request.leadEmployeeId()));
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));
    }

    private LeaveRequest findLeaveRequest(Long id) {
        return leaveRequestRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Leave request not found: " + id));
    }

    private boolean matchesSearch(Employee employee, String search) {
        if (search == null || search.isBlank()) return true;
        String needle = search.toLowerCase(Locale.ROOT);
        return PeopleOpsMapper.fullName(employee).toLowerCase(Locale.ROOT).contains(needle)
                || employee.getEmail().toLowerCase(Locale.ROOT).contains(needle)
                || employee.getJobTitle().toLowerCase(Locale.ROOT).contains(needle);
    }

    private Comparator<Employee> comparator(String sort) {
        if ("startDate".equalsIgnoreCase(sort)) return Comparator.comparing(Employee::getStartDate, Comparator.nullsLast(Comparator.naturalOrder()));
        if ("status".equalsIgnoreCase(sort)) return Comparator.comparing(employee -> employee.getStatus().name());
        return Comparator.comparing(Employee::getFirstName).thenComparing(Employee::getLastName);
    }

    private void createDefaultOnboardingTasks(Employee employee) {
        List.of("Sign employment documents", "Create company email", "Issue equipment", "Complete orientation")
                .forEach(title -> {
                    OnboardingTask task = new OnboardingTask();
                    task.setEmployee(employee);
                    task.setTitle(title);
                    task.setStatus(OnboardingStatus.TODO);
                    task.setDueDate(LocalDate.now().plusDays(7));
                    onboardingTaskRepository.save(task);
                });
    }

    private void log(String actor, String action, String entityType, Long entityId) {
        ActivityLog log = new ActivityLog();
        log.setActorName(actor);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setCreatedAt(LocalDateTime.now());
        activityLogRepository.save(log);
    }
}
