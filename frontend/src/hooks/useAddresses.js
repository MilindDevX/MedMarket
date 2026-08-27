import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);  // surfaces failure instead of silently swallowing it

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/consumer/addresses');
      setAddresses(res.data);
    } catch (err) {
      // Surface the error so callers (Checkout, AddressBook) can render an error state
      setError(err.message || 'Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (data) => {
    const res = await api.post('/consumer/addresses', data);
    await fetch();
    return res.data;
  };

  const update = async (id, data) => {
    const res = await api.patch(`/consumer/addresses/${id}`, data);
    await fetch();
    return res.data;
  };

  const remove = async (id) => {
    await api.delete(`/consumer/addresses/${id}`);
    await fetch();
  };

  const setDefault = async (id) => {
    await api.patch(`/consumer/addresses/${id}/default`, {});
    await fetch();
  };

  return { addresses, loading, error, refetch: fetch, add, update, remove, setDefault };
}
