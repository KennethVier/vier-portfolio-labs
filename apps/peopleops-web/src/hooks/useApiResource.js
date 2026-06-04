import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/client.js';

export const useApiResource = (loader) => {
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
      const message = getApiErrorMessage(requestError);
      setError(message);
      setStatus('error');
      return null;
    }
  }, [loader]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, status, error, errorMessage: error, refetch };
};
