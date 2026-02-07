import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading]     = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/consumer/addresses')
      .then(res => { setAddresses(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (data) => {
    await api.post('/consumer/addresses', data);
    fetch();
  };

  const update = async (id, data) => {
    await api.patch(`/consumer/addresses/${id}`, data);
    fetch();
  };

  const remove = async (id) => {
    await api.delete(`/consumer/addresses/${id}`);
    fetch();
  };

  const setDefault = async (id) => {
    await api.patch(`/consumer/addresses/${id}/default`, {});
    fetch();
  };

  return { addresses, loading, refetch: fetch, add, update, remove, setDefault };
}
