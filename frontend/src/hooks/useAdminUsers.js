import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useAdminUsers({ role = '' } = {}) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    const url = role ? `/admin/users?role=${role}` : '/admin/users';
    api.get(url)
      .then(res => { setUsers(res.data); setError(null); })
      .catch(err => {
        setUsers([]);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [role]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleActive = async (id, currentState) => {
    await api.patch(`/admin/users/${id}/toggle`, { is_active: !currentState });
    fetch();
  };

  return { users, loading, error, refetch: fetch, toggleActive };
}
