import { motion } from 'framer-motion';
import styles from './EmptyState.module.css';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}) {
  return (
    <motion.div
      className={`${styles.wrap} ${compact ? styles.compact : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {Icon && (
        <div className={styles.iconWrap}>
          <Icon size={compact ? 24 : 32} strokeWidth={1.2} />
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.desc}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </motion.div>
  );
}
