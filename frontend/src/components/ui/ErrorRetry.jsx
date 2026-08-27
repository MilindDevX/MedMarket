/**
 * ErrorRetry
 *
 * A reusable error state component that shows a message and a retry button.
 * Used as the fallback when a data-fetching hook returns an error.
 *
 * Props:
 *   message   string — the error string to display (from the hook's error state)
 *   onRetry   fn     — called when the user clicks "Try again"
 *   compact   bool   — renders a shorter inline variant (default: false)
 */
import { AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './ErrorRetry.module.css';

export default function ErrorRetry({ message, onRetry, compact = false }) {
  return (
    <div className={`${styles.root} ${compact ? styles.compact : ''}`} role="alert" aria-live="polite">
      <AlertTriangle
        size={compact ? 16 : 22}
        strokeWidth={1.8}
        className={styles.icon}
        aria-hidden="true"
      />
      <p className={styles.msg}>{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button className={styles.btn} onClick={onRetry} type="button">
          <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
