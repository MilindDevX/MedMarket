import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export function useStores(city) {
  const [stores, setStores]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    params.set('has_stock', 'true');  // only stores with active inventory > 0
    const query = `?${params.toString()}`;
    api.get(`/stores${query}`)
      .then(res => { setStores(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [city]);

  return { stores, loading, error };
}
