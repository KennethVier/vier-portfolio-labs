import { BACKEND_DISABLED_MESSAGE, shouldUseDemoFallback } from './demoMode.js';

export const getApiErrorMessage = (error, fallback = 'Unable to load data right now. Please check the shop service and try again.') => {
  if (shouldUseDemoFallback(error)) return BACKEND_DISABLED_MESSAGE;
  if (!error) return fallback;
  return error.response?.data?.message || error.message || fallback;
};
