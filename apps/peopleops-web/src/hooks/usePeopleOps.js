import { useCallback } from 'react';
import {
  getActivity,
  getDashboard,
  getDepartments,
  getEmployee,
  getEmployeeActivity,
  getEmployeeOnboarding,
  getEmployees,
  getLeaveRequestComments,
  getLeaveRequests,
  getOnboardingTasks,
  getTeamOverview
} from '../api/peopleOpsApi.js';
import { useApiResource } from './useApiResource.js';

const parseFilters = (filtersKey) => JSON.parse(filtersKey);

export const useDashboard = () => useApiResource(useCallback(getDashboard, []), 'dashboard');
export const useDepartments = () => useApiResource(useCallback(getDepartments, []), 'departments');
export const useTeamOverview = () => useApiResource(useCallback(getTeamOverview, []), 'team');

export const useActivityLog = (filters = {}) => {
  const filtersKey = JSON.stringify(filters);
  return useApiResource(useCallback(() => getActivity(parseFilters(filtersKey)), [filtersKey]), 'activity');
};

export const useEmployees = (filters = {}) => {
  const filtersKey = JSON.stringify(filters);
  return useApiResource(useCallback(() => getEmployees(parseFilters(filtersKey)), [filtersKey]), 'employees');
};

export const useEmployeeDetail = (id) => useApiResource(useCallback(() => getEmployee(id), [id]), 'employee', id);
export const useEmployeeOnboarding = (id) => useApiResource(useCallback(() => getEmployeeOnboarding(id), [id]), 'employeeOnboarding', id);
export const useEmployeeActivity = (id) => useApiResource(useCallback(() => getEmployeeActivity(id), [id]), 'employeeActivity', id);
export const useLeaveRequestComments = (id) => useApiResource(useCallback(() => getLeaveRequestComments(id), [id]), 'leaveComments', id);

export const useOnboardingTasks = (filters = {}) => {
  const filtersKey = JSON.stringify(filters);
  return useApiResource(useCallback(() => getOnboardingTasks(parseFilters(filtersKey)), [filtersKey]), 'onboarding');
};

export const useLeaveRequests = (filters = {}) => {
  const filtersKey = JSON.stringify(filters);
  return useApiResource(useCallback(() => getLeaveRequests(parseFilters(filtersKey)), [filtersKey]), 'leaveRequests');
};

