import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import useToastStore from '../../store/toastStore';
import styles from './ToastContainer.module.css';

const icons = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    // aria-live=polite: screen readers will announce toasts at the next pause.
    // Errors use their own role=alert (assertive) so they interrupt immediately.
    <div
      className={styles.container}
      role="status"
      aria-live="polite"
      aria-atomic="false"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map(toast => {
          const Icon = icons[toast.type] || Info;
          const isError = toast.type === 'error';
          return (
            <motion.div
              key={toast.id}
              className={`${styles.toast} ${styles[toast.type]}`}
              // Error toasts interrupt screen reader immediately (assertive)
              role={isError ? 'alert' : 'status'}
              aria-live={isError ? 'assertive' : 'polite'}
              initial={{ opacity: 0, y: 32, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              layout
            >
              <Icon size={16} strokeWidth={2} className={styles.icon} aria-hidden="true" />
              <span className={styles.message}>{toast.message}</span>
              <button
                className={styles.close}
                onClick={() => remove(toast.id)}
                aria-label={isError ? 'Dismiss error notification' : 'Dismiss notification'}
              >
                <X size={14} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
