import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useAdminOrders({ page = null } = {}) {
  const [orders,  setOrders]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    if (page !== null) {
      // Single-page fetch for AdminOrders table
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
    } else {
      // Bulk fetch — all pages for analytics aggregation
      api.get('/admin/orders?page=1&limit=100')
        .then(async res => {
          const first = res.data;
          if (!first || !Array.isArray(first.data)) {
            setOrders(Array.isArray(first) ? first : []);
            setError(null);
            return;
          }
          const allOrders = [...first.data];
          const pages = Math.ceil(first.total / 100);
          const rest = await Promise.all(
            Array.from({ length: pages - 1 }, (_, i) =>
              api.get(`/admin/orders?page=${i + 2}&limit=100`).then(r => r.data.data || [])
            )
          );
          rest.forEach(batch => allOrders.push(...batch));
          setOrders(allOrders);
          setTotal(first.total || allOrders.length);
          setError(null);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { orders, total, loading, error, refetch: fetch };
}
