import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export function useOrder(orderId) {
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    api.get(`/orders/my/${orderId}`)
      .then(res => { setOrder(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  return { order, loading, error };
}
