import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export function useMedicines(search, category) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';

    setLoading(true);
    api.get(`/medicines${query}`)
      .then(res => { setMedicines(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, category]);

  return { medicines, loading, error };
}
