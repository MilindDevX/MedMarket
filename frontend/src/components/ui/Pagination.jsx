import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable pagination bar.
 * Props:
 *   page        — current 1-indexed page
 *   totalPages  — total number of pages
 *   onPageChange(n) — called when user selects page n
 *   size        — 'sm' | 'md' (default 'md')
 */
export default function Pagination({ page, totalPages, onPageChange, size = 'md' }) {
  if (totalPages <= 1) return null;

  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1.5px solid var(--ink-200)', borderRadius: 8,
    cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
    transition: 'all 0.15s', background: 'var(--white)', color: 'var(--ink-700)',
    ...(size === 'sm'
      ? { width: 30, height: 30, fontSize: 12 }
      : { width: 36, height: 36, fontSize: 13 }),
  };

  const activeStyle = {
    ...btnBase,
    background: 'var(--green-700)',
    borderColor: 'var(--green-700)',
    color: '#FFFFFF',
  };

  const disabledStyle = {
    ...btnBase,
    opacity: 0.35,
    cursor: 'not-allowed',
  };

  // Build page number list with ellipsis
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, '…', totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '…', page - 1, page, page + 1, '…', totalPages);
    }
    return pages;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 'var(--sp-5)' }}>
      <button
        style={page === 1 ? disabledStyle : btnBase}
        onClick={() => page > 1 && onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={size === 'sm' ? 14 : 16} strokeWidth={2} />
      </button>

      {getPages().map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} style={{ fontSize: 13, color: 'var(--ink-400)', padding: '0 4px' }}>…</span>
          : (
            <button
              key={p}
              style={p === page ? activeStyle : btnBase}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
      )}

      <button
        style={page === totalPages ? disabledStyle : btnBase}
        onClick={() => page < totalPages && onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={size === 'sm' ? 14 : 16} strokeWidth={2} />
      </button>
    </div>
  );
}
