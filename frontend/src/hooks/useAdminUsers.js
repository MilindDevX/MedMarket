import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useAdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/admin/users')
      .then(res => { setUsers(res.data); setError(null); })
      .catch(err => {
        setUsers([]);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleActive = async (id, currentState) => {
    await api.patch(`/admin/users/${id}/toggle`, { is_active: !currentState });
    fetch();
  };

  return { users, loading, error, refetch: fetch, toggleActive };
}
