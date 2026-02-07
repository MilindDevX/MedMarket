import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Fetches KPI data from GET /admin/dashboard.
 * Falls back gracefully if the endpoint isn't reachable.
 */
export function useAdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/admin/dashboard')
      .then(res => { setData(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
