import { useCallback, useEffect, useState } from 'react';
import { listOrders } from '../api/orderApi.js';
import { getApiErrorMessage } from '../utils/apiErrors.js';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await listOrders();
      setOrders(response.data);
      setStatus('ready');
      return response.data;
    } catch (requestError) {
      console.error(requestError);
      setError(requestError);
      setStatus('error');
      return [];
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    data: orders,
    orders,
    status,
    error,
    errorMessage: getApiErrorMessage(error, 'Unable to load orders. Check the shop service and try again.'),
    refetch: loadOrders
  };
};