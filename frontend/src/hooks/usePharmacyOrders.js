import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

const POLL_INTERVAL_MS = 10_000; // 10 seconds

export function usePharmacyOrders(status) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [isLive,  setIsLive]  = useState(false);
  const intervalRef  = useRef(null);
  const isFirstLoad = useRef(true);

  const fetch = useCallback(() => {
    const query = status ? `?status=${status}` : '';
    // UX-5: Only show loading spinner on initial fetch, not on poll refreshes
    if (isFirstLoad.current) setLoading(true);
    api.get(`/orders/pharmacy${query}`)
      .then(res => { setOrders(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => { setLoading(false); isFirstLoad.current = false; });
  }, [status]);

  // Start / stop polling based on tab visibility
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetch();
      }
    }, POLL_INTERVAL_MS);
    setIsLive(true);
  }, [fetch]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsLive(false);
  }, []);

  useEffect(() => {
    fetch();
    startPolling();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetch();       // immediate refresh on tab focus
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetch, startPolling, stopPolling]);

  const updateStatus = async (id, action, rejection_reason) => {
    await api.patch(`/orders/pharmacy/${id}/status`, { action, rejection_reason });
    fetch();
  };

  return { orders, loading, error, isLive, refetch: fetch, updateStatus };
}

