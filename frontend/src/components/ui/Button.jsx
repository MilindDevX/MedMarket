import { motion } from 'framer-motion';
import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon,
  iconRight,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${loading ? styles.loading : ''} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      {...props}
    >
      {loading
        ? <span className={styles.btnSpinner} aria-hidden="true" />
        : (
          <>
            {Icon && !iconRight && <Icon size={16} strokeWidth={2} />}
            <span>{children}</span>
            {Icon && iconRight && <Icon size={16} strokeWidth={2} />}
          </>
        )
      }
    </motion.button>
  );
}
