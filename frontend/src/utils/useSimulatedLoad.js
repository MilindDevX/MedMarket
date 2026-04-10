import { useState, useEffect } from 'react';

export default function useSimulatedLoad(data, delayMs = 500) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setResult(data);
      setLoading(false);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [data, delayMs]);

  return { loading, data: result ?? data };
}
