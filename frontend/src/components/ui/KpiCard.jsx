import { motion } from 'framer-motion';
import styles from './KpiCard.module.css';

export default function KpiCard({ label, value, sub, subColor, icon: Icon, iconColor, index = 0 }) {
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
    >
      {Icon && (
        <div className={styles.iconWrap} style={{ background: iconColor ? `${iconColor}15` : 'var(--green-50)' }}>
          <Icon size={18} strokeWidth={1.8} style={{ color: iconColor || 'var(--green-700)' }} />
        </div>
      )}
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {sub && (
        <div className={styles.sub} style={{ color: subColor || 'var(--green-700)' }}>
          {sub}
        </div>
      )}
    </motion.div>
  );
}
