import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/notifications')
      .then(res => { setNotifications(res.data || []); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const markOneRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    try { await api.patch(`/notifications/${id}/read`, {}); }
    catch { fetch(); } // revert on error
  }, [fetch]);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || now })));
    try { await api.patch('/notifications/read-all', {}); }
    catch { fetch(); }
  }, [fetch]);

  const deleteOne = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try { await api.delete(`/notifications/${id}`); }
    catch { fetch(); }
  }, [fetch]);

  const deleteAll = useCallback(async () => {
    setNotifications([]);
    try { await api.delete('/notifications'); }
    catch { fetch(); }
  }, [fetch]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return { notifications, loading, error, unreadCount, markOneRead, markAllRead, deleteOne, deleteAll, refetch: fetch };
}
