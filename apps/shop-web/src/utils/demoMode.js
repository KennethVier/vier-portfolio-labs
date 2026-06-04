export const DEMO_FALLBACK_ENABLED = import.meta.env.VITE_DEMO_FALLBACK_ENABLED !== 'false';

export const BACKEND_DISABLED_MESSAGE = 'Live backend is currently disabled for this portfolio demo. Contact the admin to enable this workflow.';

export const isNetworkLikeError = (error) => !error?.response || error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';

export const shouldUseDemoFallback = (error) => DEMO_FALLBACK_ENABLED && isNetworkLikeError(error);

export const demoResponse = (data) => ({ data, isDemoFallback: true });
