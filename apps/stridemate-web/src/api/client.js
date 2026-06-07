import axios from 'axios';

export const runningClient = axios.create({
  baseURL: import.meta.env.VITE_RUNNING_API_BASE_URL || 'http://localhost:8088/api/running',
});

export function getApiErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'StrideMate could not reach the coach service.';
}
