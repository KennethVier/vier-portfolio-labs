package com.portfolio.peopleops.seed;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.portfolio.peopleops.entity.*;
import com.portfolio.peopleops.mapper.PeopleOpsMapper;
import com.portfolio.peopleops.repository.*;

@Component
public class PeopleOpsDataSeeder implements CommandLineRunner {
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final OnboardingTaskRepository onboardingTaskRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveRequestCommentRepository leaveRequestCommentRepository;
    private final ActivityLogRepository activityLogRepository;

    public PeopleOpsDataSeeder(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository,
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
    public void run(String... args) {
        if (employeeRepository.count() > 0) {
            seedExistingLeaveRequestComments();
            return;
        }

        Department engineering = department("Engineering", "Builds platform services and product experiences.", "Manila HQ");
        Department product = department("Product", "Owns discovery, roadmap, and delivery coordination.", "Remote");
        Department people = department("People", "Supports hiring, onboarding, and employee experience.", "Manila HQ");
        Department operations = department("Operations", "Keeps internal workflows and service delivery moving.", "Cebu Hub");
        Department sales = department("Sales", "Handles accounts, customer growth, and pipeline operations.", "Remote");
        departmentRepository.saveAll(List.of(engineering, product, people, operations, sales));

        Employee ken = employee("PO-1001", "Kenneth", "Cerrado", "kenneth@peopleops.demo", "Engineering Manager", engineering, null, EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, "Manila HQ", 900);
        Employee maria = employee("PO-1002", "Maria", "Santos", "maria@peopleops.demo", "Product Lead", product, null, EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, "Remote", 760);
        Employee lea = employee("PO-1003", "Lea", "Reyes", "lea@peopleops.demo", "People Partner", people, null, EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, "Manila HQ", 620);
        Employee dion = employee("PO-1004", "Dion", "Garcia", "dion@peopleops.demo", "Operations Lead", operations, null, EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, "Cebu Hub", 530);
        Employee paolo = employee("PO-1005", "Paolo", "Cruz", "paolo@peopleops.demo", "Sales Manager", sales, null, EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, "Remote", 480);
        employeeRepository.saveAll(List.of(ken, maria, lea, dion, paolo));

        engineering.setLeadEmployee(ken); product.setLeadEmployee(maria); people.setLeadEmployee(lea); operations.setLeadEmployee(dion); sales.setLeadEmployee(paolo);
        departmentRepository.saveAll(List.of(engineering, product, people, operations, sales));

        List<Employee> employees = List.of(
                ken, maria, lea, dion, paolo,
                employee("PO-1006", "Alyssa", "Lim", "alyssa@peopleops.demo", "Frontend Engineer", engineering, ken, EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, "Manila HQ", 320),
                employee("PO-1007", "Miguel", "Tan", "miguel@peopleops.demo", "Backend Engineer", engineering, ken, EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, "Manila HQ", 290),
                employee("PO-1008", "Sofia", "Dela Cruz", "sofia@peopleops.demo", "QA Engineer", engineering, ken, EmployeeStatus.ONBOARDING, EmploymentType.FULL_TIME, "Remote", 12),
                employee("PO-1009", "Rafael", "Ocampo", "rafael@peopleops.demo", "Product Designer", product, maria, EmployeeStatus.ACTIVE, EmploymentType.CONTRACT, "Remote", 160),
                employee("PO-1010", "Bianca", "Villanueva", "bianca@peopleops.demo", "Recruiter", people, lea, EmployeeStatus.ONBOARDING, EmploymentType.FULL_TIME, "Manila HQ", 18),
                employee("PO-1011", "Enzo", "Navarro", "enzo@peopleops.demo", "Operations Analyst", operations, dion, EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, "Cebu Hub", 210),
                employee("PO-1012", "Jasmine", "Uy", "jasmine@peopleops.demo", "Account Executive", sales, paolo, EmployeeStatus.ON_LEAVE, EmploymentType.FULL_TIME, "Remote", 400),
                employee("PO-1013", "Carlo", "Mendoza", "carlo@peopleops.demo", "Customer Success Specialist", sales, paolo, EmployeeStatus.ACTIVE, EmploymentType.PART_TIME, "Remote", 110),
                employee("PO-1014", "Nina", "Bautista", "nina@peopleops.demo", "People Operations Associate", people, lea, EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, "Manila HQ", 75),
                employee("PO-1015", "Theo", "Ramos", "theo@peopleops.demo", "Platform Engineer", engineering, ken, EmployeeStatus.INACTIVE, EmploymentType.CONTRACT, "Manila HQ", 690)
        );
        employeeRepository.saveAll(employees);

        seedOnboarding(employeeRepository.findAll().stream().filter(employee -> employee.getStatus() == EmployeeStatus.ONBOARDING).toList());
        seedLeaveRequests(employees);
        seedActivity(employees);
    }

    private Department department(String name, String description, String location) {
        Department department = new Department();
        department.setName(name);
        department.setDescription(description);
        department.setLocation(location);
        return department;
    }

    private Employee employee(String number, String firstName, String lastName, String email, String jobTitle,
            Department department, Employee manager, EmployeeStatus status, EmploymentType type, String location, int daysAgo) {
        Employee employee = new Employee();
        employee.setEmployeeNumber(number);
        employee.setFirstName(firstName);
        employee.setLastName(lastName);
        employee.setEmail(email);
        employee.setPhone("+63 917 " + number.substring(3) + " 000");
        employee.setJobTitle(jobTitle);
        employee.setDepartment(department);
        employee.setManager(manager);
        employee.setStatus(status);
        employee.setEmploymentType(type);
        employee.setLocation(location);
        employee.setStartDate(LocalDate.now().minusDays(daysAgo));
        return employee;
    }

    private void seedOnboarding(List<Employee> onboardingEmployees) {
        for (Employee employee : onboardingEmployees) {
            onboardingTaskRepository.save(task(employee, "Sign employment documents", OnboardingStatus.DONE, 10));
            onboardingTaskRepository.save(task(employee, "Create company email", OnboardingStatus.DONE, 8));
            onboardingTaskRepository.save(task(employee, "Issue equipment", OnboardingStatus.IN_PROGRESS, 4));
            onboardingTaskRepository.save(task(employee, "Complete team orientation", OnboardingStatus.TODO, 7));
            onboardingTaskRepository.save(task(employee, "Schedule first-week review", OnboardingStatus.TODO, 12));
        }
    }

    private OnboardingTask task(Employee employee, String title, OnboardingStatus status, int dueInDays) {
        OnboardingTask task = new OnboardingTask();
        task.setEmployee(employee);
        task.setTitle(title);
        task.setStatus(status);
        task.setDueDate(LocalDate.now().plusDays(dueInDays));
        task.setCompletedDate(status == OnboardingStatus.DONE ? LocalDate.now().minusDays(1) : null);
        return task;
    }

    private void seedLeaveRequests(List<Employee> employees) {
        LeaveRequest approved = leaveRequestRepository.save(leave(employees.get(11), LeaveType.VACATION, LeaveStatus.APPROVED, "Family travel", "Approved. Coverage arranged."));
        LeaveRequest remote = leaveRequestRepository.save(leave(employees.get(6), LeaveType.REMOTE_WORK, LeaveStatus.PENDING, "Work from province for two days", null));
        LeaveRequest personal = leaveRequestRepository.save(leave(employees.get(9), LeaveType.PERSONAL, LeaveStatus.PENDING, "Personal appointment", null));
        LeaveRequest rejected = leaveRequestRepository.save(leave(employees.get(12), LeaveType.SICK, LeaveStatus.REJECTED, "Follow-up checkup", "Please resubmit with updated dates."));

        leaveRequestCommentRepository.save(comment(approved, "Paolo Cruz", "Manager", "Coverage is assigned to Carlo while Jasmine is out.", 5));
        leaveRequestCommentRepository.save(comment(remote, "Miguel Tan", "Employee", "I will stay available during core collaboration hours.", 4));
        leaveRequestCommentRepository.save(comment(remote, "Kenneth Cerrado", "Manager", "Please confirm handoff notes before the remote-work dates.", 3));
        leaveRequestCommentRepository.save(comment(personal, "Bianca Villanueva", "Employee", "This is for a scheduled government appointment.", 2));
        leaveRequestCommentRepository.save(comment(rejected, "PeopleOps Admin", "Admin", "Updated documentation is needed before this can be approved.", 1));
    }

    private LeaveRequest leave(Employee employee, LeaveType type, LeaveStatus status, String reason, String note) {
        LeaveRequest request = new LeaveRequest();
        request.setEmployee(employee);
        request.setType(type);
        request.setStartDate(LocalDate.now().plusDays(3));
        request.setEndDate(LocalDate.now().plusDays(5));
        request.setReason(reason);
        request.setStatus(status);
        request.setReviewerNote(note);
        return request;
    }

    private LeaveRequestComment comment(LeaveRequest leaveRequest, String authorName, String authorRole, String message, int hoursAgo) {
        LeaveRequestComment comment = new LeaveRequestComment();
        comment.setLeaveRequest(leaveRequest);
        comment.setAuthorName(authorName);
        comment.setAuthorRole(authorRole);
        comment.setMessage(message);
        comment.setCreatedAt(LocalDateTime.now().minusHours(hoursAgo));
        return comment;
    }

    private void seedExistingLeaveRequestComments() {
        if (leaveRequestCommentRepository.count() > 0) return;
        List<LeaveRequest> requests = leaveRequestRepository.findAll();
        if (requests.isEmpty()) return;
        for (int index = 0; index < requests.size(); index++) {
            LeaveRequest request = requests.get(index);
            leaveRequestCommentRepository.save(comment(request, "PeopleOps Admin", "Admin",
                    index % 2 == 0 ? "Seeded review context for this existing demo request." : "Seeded employee-manager discussion for this existing demo request.",
                    index + 1));
        }
    }
    private void seedActivity(List<Employee> employees) {
        activityLogRepository.save(log("PeopleOps Admin", "Added " + PeopleOpsMapper.fullName(employees.get(9)) + " to People", "EMPLOYEE", employees.get(9).getId(), 1));
        activityLogRepository.save(log("Dion Garcia", "Updated onboarding task for Sofia Dela Cruz", "ONBOARDING", employees.get(7).getId(), 2));
        activityLogRepository.save(log("PeopleOps Admin", "Approved vacation request for Jasmine Uy", "LEAVE_REQUEST", employees.get(11).getId(), 3));
        activityLogRepository.save(log("Maria Santos", "Updated Product department lead notes", "DEPARTMENT", employees.get(1).getDepartment().getId(), 4));
        activityLogRepository.save(log("Kenneth Cerrado", "Reviewed Engineering onboarding queue", "ONBOARDING", employees.get(0).getId(), 5));
    }

    private ActivityLog log(String actor, String action, String entityType, Long entityId, int hoursAgo) {
        ActivityLog log = new ActivityLog();
        log.setActorName(actor);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setCreatedAt(LocalDateTime.now().minusHours(hoursAgo));
        return log;
    }
}

