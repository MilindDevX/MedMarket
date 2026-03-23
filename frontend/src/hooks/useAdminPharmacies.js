import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useAdminPharmacies(statusFilter) {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(() => {
    const query = (statusFilter && statusFilter !== 'all' && statusFilter !== '') ? `?status=${statusFilter}` : '';
    setLoading(true);
    api.get(`/admin/applications${query}`)
      .then(res => { setApps(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const approve = async (id) => {
    await api.patch(`/admin/applications/${id}/approve`, {});
    fetch();
  };

  const reject = async (id, rejection_reason) => {
    await api.patch(`/admin/applications/${id}/reject`, { rejection_reason });
    fetch();
  };

  const suspend = async (id) => {
    await api.patch(`/admin/applications/${id}/suspend`, {});
    fetch();
  };

  return { apps, loading, error, refetch: fetch, approve, reject, suspend };
}
