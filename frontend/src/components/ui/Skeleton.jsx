import styles from './Skeleton.module.css';

export function SkeletonLine({ width = '100%', height = 16, borderRadius = 6 }) {
  return (
    <div
      className={styles.skeleton}
      style={{ width, height, borderRadius }}
    />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className={styles.card}>
      <SkeletonLine width="60%" height={18} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 2 ? '40%' : '100%'} height={14} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className={styles.tableWrap}>
      {/* Header */}
      <div className={styles.tableRow} style={{ background: 'var(--ink-50)', borderRadius: '12px 12px 0 0' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width="60%" height={12} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className={styles.tableRow}>
          {Array.from({ length: cols }).map((_, ci) => (
            <SkeletonLine key={ci} width={ci === 0 ? '80%' : ci === cols - 1 ? '40%' : '60%'} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Skeleton({ variant = 'card', ...props }) {
  if (variant === 'table') return <SkeletonTable {...props} />;
  if (variant === 'line')  return <SkeletonLine {...props} />;
  return <SkeletonCard {...props} />;
}
