import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useAdminMedicines(search, category) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetch = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';
    setLoading(true);
    api.get(`/medicines${query}`)
      .then(res => { setMedicines(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, category]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data) => {
    await api.post('/medicines', data);
    fetch();
  };

  const update = async (id, data) => {
    await api.patch(`/medicines/${id}`, data);
    fetch();
  };

  const deactivate = async (id) => {
    await api.delete(`/medicines/${id}`);
    fetch();
  };

  return { medicines, loading, error, refetch: fetch, create, update, deactivate };
}
