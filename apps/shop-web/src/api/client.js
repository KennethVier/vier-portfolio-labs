import axios from 'axios';

export const API_ROOT = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_ROOT,
  timeout: 10000
});