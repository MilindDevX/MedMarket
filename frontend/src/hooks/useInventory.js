import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/pharmacy/inventory')
      .then(res => { setInventory(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addItem = async (data) => {
    await api.post('/pharmacy/inventory', data);
    fetch();
  };

  const updateItem = async (id, data) => {
    await api.patch(`/pharmacy/inventory/${id}`, data);
    fetch();
  };

  const deleteItem = async (id) => {
    await api.delete(`/pharmacy/inventory/${id}`);
    fetch();
  };

  return { inventory, loading, error, refetch: fetch, addItem, updateItem, deleteItem };
}
