import styles from './Badge.module.css';

export default function Badge({ children, variant = 'default', dot = false }) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
