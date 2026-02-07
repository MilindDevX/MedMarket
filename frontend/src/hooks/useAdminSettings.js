import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Loads platform settings from GET /admin/settings
 * and exposes a save(section, patch) function that calls PATCH /admin/settings.
 */
export function useAdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/settings')
      .then(res => { setSettings(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /**
   * Save a partial patch.
   * @param {object} patch - only the fields to update
   * @returns {Promise<void>}
   */
  const save = useCallback(async (patch) => {
    setSaving(true);
    try {
      const res = await api.patch('/admin/settings', patch);
      setSettings(res.data);
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, error, save };
}
