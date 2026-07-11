import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Fetches all platform-level analytics from a single DB-aggregated endpoint.
 * Replaces the previous pattern of bulk-fetching all orders and aggregating in the browser.
 */
export function useAdminPlatformAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/admin/analytics/platform')
      .then(res => {
        setData(res.data);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
