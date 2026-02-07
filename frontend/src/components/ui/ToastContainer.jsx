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
    <div className={styles.container}>
      <AnimatePresence initial={false}>
        {toasts.map(toast => {
          const Icon = icons[toast.type] || Info;
          return (
            <motion.div
              key={toast.id}
              className={`${styles.toast} ${styles[toast.type]}`}
              initial={{ opacity: 0, y: 32, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              layout
            >
              <Icon size={16} strokeWidth={2} className={styles.icon} />
              <span className={styles.message}>{toast.message}</span>
              <button className={styles.close} onClick={() => remove(toast.id)}>
                <X size={14} strokeWidth={2.5} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
