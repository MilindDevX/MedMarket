import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function usePharmacyOrders(status) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(() => {
    const query = status ? `?status=${status}` : '';
    setLoading(true);
    api.get(`/orders/pharmacy${query}`)
      .then(res => { setOrders(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = async (id, action, rejection_reason) => {
    await api.patch(`/orders/pharmacy/${id}/status`, { action, rejection_reason });
    fetch();
  };

  return { orders, loading, error, refetch: fetch, updateStatus };
}
