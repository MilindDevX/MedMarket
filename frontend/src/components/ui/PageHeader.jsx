import { motion } from 'framer-motion';
import styles from './PageHeader.module.css';

export default function PageHeader({ title, subtitle, action, badge }) {
  return (
    <motion.div
      className={styles.header}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      <div className={styles.left}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {badge && <span className={styles.badge}>{badge}</span>}
        </div>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.right}>{action}</div>}
    </motion.div>
  );
}
