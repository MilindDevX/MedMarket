import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export function useStoreDetail(storeId) {
  const [store, setStore]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    api.get(`/stores/${storeId}`)
      .then(res => { setStore(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [storeId]);

  return { store, loading, error };
}
