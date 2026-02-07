import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get('/orders/my')
      .then(res => { setOrders(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const cancelOrder = async (id) => {
    await api.post(`/orders/my/${id}/cancel`, {});
    fetchOrders();
  };

  return { orders, loading, error, refetch: fetchOrders, cancelOrder };
}
