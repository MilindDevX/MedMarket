import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function usePharmacyAnalytics(storeId) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(() => {
    if (!storeId) { setData(null); return; }
    setLoading(true);
    api.get(`/admin/analytics/pharmacy/${storeId}`)
      .then(res => { setData(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error };
}
