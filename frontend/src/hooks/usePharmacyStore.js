import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function usePharmacyStore() {
  const [store, setStore]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/pharmacy/me')
      .then(res => { setStore(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { store, loading, error, refetch: fetch };
}
