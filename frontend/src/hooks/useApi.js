import { useState, useCallback } from 'react';

/**
 * Reusable async API execution hook with loading, error, and data states.
 */
export function useApi(apiFunc) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...args);
        setData(result);
        return { data: result, error: null };
      } catch (err) {
        const message = err.response?.data?.detail || err.message || 'An error occurred';
        setError(message);
        return { data: null, error: message };
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  return { data, loading, error, execute, setData };
}

export default useApi;
