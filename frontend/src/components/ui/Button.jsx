import { motion } from 'framer-motion';
import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconRight,
  className = '',
  ...props
}) {
  return (
    <motion.button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      {...props}
    >
      {Icon && !iconRight && <Icon size={16} strokeWidth={2} />}
      <span>{children}</span>
      {Icon && iconRight && <Icon size={16} strokeWidth={2} />}
    </motion.button>
  );
}
