import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/client.js';
import { BACKEND_DISABLED_MESSAGE, getDemoData, shouldUseDemoFallback } from '../utils/demoData.js';

export const useApiResource = (loader, fallbackKey = null, fallbackContext = null) => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const response = await loader();
      setData(response.data);
      setStatus('ready');
      return response.data;
    } catch (requestError) {
      console.error(requestError);
      if (fallbackKey && shouldUseDemoFallback(requestError)) {
        const fallback = getDemoData(fallbackKey, fallbackContext);
        setData(fallback);
        setError(BACKEND_DISABLED_MESSAGE);
        setStatus('demo');
        return fallback;
      }
      const message = getApiErrorMessage(requestError);
      setError(message);
      setStatus('error');
      return null;
    }
  }, [fallbackContext, fallbackKey, loader]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, status, error, errorMessage: error, isDemoFallback: status === 'demo', refetch };
};
