export const DEMO_ROLES = ['Admin', 'Manager', 'Employee'];

const ROLE_PROFILES = {
  Admin: {
    label: 'Admin',
    workspaceTitle: 'Organization command center',
    shortDescription: 'Full demo access across people, teams, requests, and audit activity.',
    dashboardEyebrow: 'Organization overview',
    dashboardTitle: 'PeopleOps command center',
    dashboardCopy: 'Track company-wide headcount, departments, onboarding, approvals, and audit activity.',
    focusAreas: ['Workforce control', 'Approvals', 'Audit trail'],
    actions: ['manageEmployees', 'manageDepartments', 'reviewRequests', 'updateOnboarding', 'viewAll', 'exportData']
  },
  Manager: {
    label: 'Manager',
    workspaceTitle: 'Team operations workspace',
    shortDescription: 'Approvals, onboarding progress, and team visibility for demo managers.',
    dashboardEyebrow: 'Team operations',
    dashboardTitle: 'Manager workspace',
    dashboardCopy: 'Review pending requests, monitor onboarding progress, and keep team movement visible.',
    focusAreas: ['Team visibility', 'Request review', 'Onboarding follow-up'],
    actions: ['reviewRequests', 'updateOnboarding', 'viewAll', 'exportData']
  },
  Employee: {
    label: 'Employee',
    workspaceTitle: 'Self-service workspace',
    shortDescription: 'Read-only organization context with request submission and comments.',
    dashboardEyebrow: 'Self-service view',
    dashboardTitle: 'My PeopleOps workspace',
    dashboardCopy: 'Submit requests, follow onboarding context, and understand the team structure around you.',
    focusAreas: ['My requests', 'Team context', 'Company directory'],
    actions: ['submitRequest', 'commentRequests']
  }
};

export const getRoleProfile = (role) => ROLE_PROFILES[role] ?? ROLE_PROFILES.Admin;

export const roleCan = (role, action) => getRoleProfile(role).actions.includes(action);
