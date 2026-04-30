import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    const base = 'MedMarket India';
    document.title = title ? `${title} — ${base}` : base;
    return () => { document.title = base; };
  }, [title]);
}
