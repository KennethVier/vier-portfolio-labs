export const BACKEND_DISABLED_MESSAGE = 'Live backend is currently disabled for this portfolio demo. Contact the admin to enable this workflow.';
export const DEMO_FALLBACK_ENABLED = import.meta.env.VITE_DEMO_FALLBACK_ENABLED !== 'false';
export const shouldUseDemoFallback = (error) => DEMO_FALLBACK_ENABLED && (!error?.response || error?.code === 'ERR_NETWORK' || error?.message === 'Network Error');

export const employees = [
  { id: 1, employeeNumber: 'EMP-1001', firstName: 'Mira', lastName: 'Santos', fullName: 'Mira Santos', email: 'mira@vierlabs.dev', phone: '+63 900 111 0001', jobTitle: 'People Operations Lead', departmentId: 1, departmentName: 'People', managerId: null, managerName: null, status: 'ACTIVE', employmentType: 'FULL_TIME', startDate: '2025-02-03', location: 'Manila, PH' },
  { id: 2, employeeNumber: 'EMP-1002', firstName: 'Ken', lastName: 'Cerrado', fullName: 'Ken Cerrado', email: 'ken@vierlabs.dev', phone: '+63 900 111 0002', jobTitle: 'Full Stack Engineer', departmentId: 2, departmentName: 'Engineering', managerId: 4, managerName: 'Ari Tan', status: 'ACTIVE', employmentType: 'FULL_TIME', startDate: '2024-10-14', location: 'Cavite, PH' },
  { id: 3, employeeNumber: 'EMP-1003', firstName: 'Lia', lastName: 'Reyes', fullName: 'Lia Reyes', email: 'lia@vierlabs.dev', phone: '+63 900 111 0003', jobTitle: 'Product Designer', departmentId: 3, departmentName: 'Product', managerId: 5, managerName: 'Nico Cruz', status: 'ONBOARDING', employmentType: 'FULL_TIME', startDate: '2026-05-20', location: 'Makati, PH' },
  { id: 4, employeeNumber: 'EMP-1004', firstName: 'Ari', lastName: 'Tan', fullName: 'Ari Tan', email: 'ari@vierlabs.dev', phone: '+63 900 111 0004', jobTitle: 'Engineering Manager', departmentId: 2, departmentName: 'Engineering', managerId: null, managerName: null, status: 'ACTIVE', employmentType: 'FULL_TIME', startDate: '2023-07-10', location: 'Quezon City, PH' },
  { id: 5, employeeNumber: 'EMP-1005', firstName: 'Nico', lastName: 'Cruz', fullName: 'Nico Cruz', email: 'nico@vierlabs.dev', phone: '+63 900 111 0005', jobTitle: 'Product Manager', departmentId: 3, departmentName: 'Product', managerId: null, managerName: null, status: 'ON_LEAVE', employmentType: 'FULL_TIME', startDate: '2024-01-15', location: 'Taguig, PH' }
];

export const departments = [
  { id: 1, name: 'People', description: 'Employee experience, onboarding, and operating rhythm.', leadEmployeeId: 1, leadEmployeeName: 'Mira Santos', location: 'Manila, PH', headcount: 1, activeCount: 1, onboardingCount: 0 },
  { id: 2, name: 'Engineering', description: 'Platform delivery and service reliability.', leadEmployeeId: 4, leadEmployeeName: 'Ari Tan', location: 'Cavite, PH', headcount: 2, activeCount: 2, onboardingCount: 0 },
  { id: 3, name: 'Product', description: 'Product planning, research, and design systems.', leadEmployeeId: 5, leadEmployeeName: 'Nico Cruz', location: 'Makati, PH', headcount: 2, activeCount: 0, onboardingCount: 1 }
];

export const activity = [
  { id: 1, actorName: 'PeopleOps Admin', action: 'Published demo fallback roster', entityType: 'EMPLOYEE', entityId: 1, createdAt: '2026-06-04T09:00:00' },
  { id: 2, actorName: 'Manager', action: 'Reviewed remote work request', entityType: 'LEAVE_REQUEST', entityId: 1, createdAt: '2026-06-03T14:30:00' },
  { id: 3, actorName: 'System', action: 'Synced onboarding checklist progress', entityType: 'ONBOARDING', entityId: 2, createdAt: '2026-06-02T10:10:00' }
];

export const onboarding = [
  { id: 1, employeeId: 3, employeeName: 'Lia Reyes', title: 'Complete product design system walkthrough', status: 'IN_PROGRESS', dueDate: '2026-06-10', completedDate: null },
  { id: 2, employeeId: 3, employeeName: 'Lia Reyes', title: 'Set up access to project workspace', status: 'DONE', dueDate: '2026-06-05', completedDate: '2026-06-04' }
];

export const requests = [
  { id: 1, employeeId: 5, employeeName: 'Nico Cruz', type: 'REMOTE_WORK', startDate: '2026-06-07', endDate: '2026-06-07', reason: 'Deep work day for roadmap planning.', status: 'PENDING', reviewerNote: '', commentCount: 1 },
  { id: 2, employeeId: 2, employeeName: 'Ken Cerrado', type: 'VACATION', startDate: '2026-06-20', endDate: '2026-06-21', reason: 'Family weekend.', status: 'APPROVED', reviewerNote: 'Coverage confirmed.', commentCount: 1 }
];

export const comments = {
  1: [{ id: 1, leaveRequestId: 1, authorName: 'PeopleOps Admin', authorRole: 'Admin', message: 'Demo comment shown while the backend is disabled.', createdAt: '2026-06-04T09:30:00' }],
  2: [{ id: 2, leaveRequestId: 2, authorName: 'Ari Tan', authorRole: 'Manager', message: 'Approved with sprint coverage handled.', createdAt: '2026-06-03T11:20:00' }]
};

export const dashboard = {
  totalEmployees: employees.length,
  activeEmployees: employees.filter((item) => item.status === 'ACTIVE').length,
  onboardingEmployees: employees.filter((item) => item.status === 'ONBOARDING').length,
  pendingLeaveRequests: requests.filter((item) => item.status === 'PENDING').length,
  departmentDistribution: departments.map((department) => ({ departmentName: department.name, headcount: department.headcount })),
  onboardingCompletionSummary: { completed: 1, total: 2, completionRate: 50 },
  recentActivity: activity
};

export const team = {
  teams: [
    { manager: employees[3], directReports: [employees[1]], teamHeadcount: 1, activeCount: 1, onboardingCount: 0, onLeaveCount: 0 },
    { manager: employees[4], directReports: [employees[2]], teamHeadcount: 1, activeCount: 0, onboardingCount: 1, onLeaveCount: 0 }
  ]
};

export const getDemoData = (key, context) => {
  if (key === 'dashboard') return dashboard;
  if (key === 'employees') return employees;
  if (key === 'employee') return employees.find((item) => String(item.id) === String(context)) || employees[0];
  if (key === 'departments') return departments;
  if (key === 'team') return team;
  if (key === 'activity') return activity;
  if (key === 'onboarding') return onboarding;
  if (key === 'employeeOnboarding') return onboarding.filter((item) => String(item.employeeId) === String(context));
  if (key === 'employeeActivity') return activity;
  if (key === 'leaveRequests') return requests;
  if (key === 'leaveComments') return comments[context] || [];
  return null;
};
