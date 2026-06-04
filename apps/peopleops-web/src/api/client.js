import axios from 'axios';

export const peopleOpsClient = axios.create({
  baseURL: import.meta.env.VITE_PEOPLEOPS_API_BASE_URL || 'http://localhost:8080/api/peopleops',
  timeout: 10000
});

export const getApiErrorMessage = (error, fallback = 'PeopleOps service is unavailable. Start employee-service and try again.') => (
  error?.response?.data?.message || error?.message || fallback
);