import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * PERF-2: Removed the bulk-fetch fallback that downloaded ALL orders
 * client-side for analytics aggregation. Analytics are now fully
 * server-side via getPlatformAnalytics, so this hook only needs
 * paginated single-page fetches.
 */
export function useAdminOrders({ page = 1 } = {}) {
  const [orders,  setOrders]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get(`/admin/orders?page=${page}&limit=50`)
      .then(res => {
        const payload = res.data;
        if (payload && Array.isArray(payload.data)) {
          setOrders(payload.data);
          setTotal(payload.total || 0);
        } else {
          // Legacy flat-array fallback
          setOrders(Array.isArray(payload) ? payload : []);
        }
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { orders, total, loading, error, refetch: fetch };
}
