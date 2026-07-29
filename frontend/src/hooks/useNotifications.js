import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const intervalRef  = useRef(null);
  const isFirstLoad = useRef(true);

  const fetchNotifications = useCallback(() => {
    // UX-4: Only show loading on initial fetch
    if (isFirstLoad.current) setLoading(true);
    api.get('/notifications')
      .then(res => { setNotifications(res.data || []); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => { setLoading(false); isFirstLoad.current = false; });
  }, []);

  // UX-4: Background polling — refresh every 30s when tab is visible
  useEffect(() => {
    fetchNotifications();

    const startPolling = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') fetchNotifications();
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchNotifications]);

  const markOneRead = useCallback(async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    try { await api.patch(`/notifications/${id}/read`, {}); }
    catch { fetchNotifications(); } // revert on error
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || now })));
    try { await api.patch('/notifications/read-all', {}); }
    catch { fetchNotifications(); }
  }, [fetchNotifications]);

  const deleteOne = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try { await api.delete(`/notifications/${id}`); }
    catch { fetchNotifications(); }
  }, [fetchNotifications]);

  const deleteAll = useCallback(async () => {
    setNotifications([]);
    try { await api.delete('/notifications'); }
    catch { fetchNotifications(); }
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return { notifications, loading, error, unreadCount, markOneRead, markAllRead, deleteOne, deleteAll, refetch: fetchNotifications };
}
