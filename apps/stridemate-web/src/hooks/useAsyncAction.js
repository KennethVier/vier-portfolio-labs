import { useState } from 'react';
import { getApiErrorMessage } from '../api/client.js';

export function useAsyncAction() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function run(action) {
    setStatus('loading');
    setError('');
    try {
      const result = await action();
      setStatus('success');
      return result;
    } catch (err) {
      setError(getApiErrorMessage(err));
      setStatus('error');
      return null;
    }
  }

  return { status, error, run, isLoading: status === 'loading' };
}
