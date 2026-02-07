import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useAdminMedicines() {
  const [allMedicines, setAllMedicines] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/medicines')
      .then(res => { setAllMedicines(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data) => { await api.post('/medicines', data); fetch(); };
  const update = async (id, data) => { await api.patch(`/medicines/${id}`, data); fetch(); };
  const deactivate = async (id) => { await api.delete(`/medicines/${id}`); fetch(); };

  return { allMedicines, loading, error, refetch: fetch, create, update, deactivate };
}
