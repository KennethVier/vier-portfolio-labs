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

export const useDashboard = () => useApiResource(useCallback(getDashboard, []));
export const useDepartments = () => useApiResource(useCallback(getDepartments, []));
export const useTeamOverview = () => useApiResource(useCallback(getTeamOverview, []));

export const useActivityLog = (filters = {}) => {
  const filtersKey = JSON.stringify(filters);
  return useApiResource(useCallback(() => getActivity(parseFilters(filtersKey)), [filtersKey]));
};

export const useEmployees = (filters = {}) => {
  const filtersKey = JSON.stringify(filters);
  return useApiResource(useCallback(() => getEmployees(parseFilters(filtersKey)), [filtersKey]));
};

export const useEmployeeDetail = (id) => useApiResource(useCallback(() => getEmployee(id), [id]));
export const useEmployeeOnboarding = (id) => useApiResource(useCallback(() => getEmployeeOnboarding(id), [id]));
export const useEmployeeActivity = (id) => useApiResource(useCallback(() => getEmployeeActivity(id), [id]));
export const useLeaveRequestComments = (id) => useApiResource(useCallback(() => getLeaveRequestComments(id), [id]));

export const useOnboardingTasks = (filters = {}) => {
  const filtersKey = JSON.stringify(filters);
  return useApiResource(useCallback(() => getOnboardingTasks(parseFilters(filtersKey)), [filtersKey]));
};

export const useLeaveRequests = (filters = {}) => {
  const filtersKey = JSON.stringify(filters);
  return useApiResource(useCallback(() => getLeaveRequests(parseFilters(filtersKey)), [filtersKey]));
};
