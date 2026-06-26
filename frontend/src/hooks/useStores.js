import { useState, useEffect } from 'react';
import { api } from '../utils/api';

/**
 * Fetches nearby stores.
 * Geo mode:  when lat + lng are provided, uses Haversine radius search (sorted by distance).
 * City mode: falls back to city-based ILIKE search when no coordinates.
 */
export function useStores({ city, lat, lng, radius = 20 } = {}) {
  const [stores, setStores]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('has_stock', 'true');

    if (lat != null && lng != null) {
      params.set('lat', lat);
      params.set('lng', lng);
      params.set('radius', radius);
    } else if (city) {
      params.set('city', city);
    }

    api.get(`/stores?${params.toString()}`)
      .then(res => { setStores(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [city, lat, lng, radius]);

  return { stores, loading, error };
}
