import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useAdminOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/admin/orders')
      .then(res => { setOrders(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { orders, loading, error, refetch: fetch };
}
