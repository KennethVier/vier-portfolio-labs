export const getApiErrorMessage = (error, fallback = 'Unable to load data right now. Please check the shop service and try again.') => {
  if (!error) return fallback;
  return error.response?.data?.message || error.message || fallback;
};