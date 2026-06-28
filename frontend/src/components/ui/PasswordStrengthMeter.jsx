import styles from './PasswordStrengthMeter.module.css';

function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak',      color: 'var(--danger)' };
  if (score === 2) return { score, label: 'Fair',      color: 'var(--warning-dark)' };
  if (score === 3) return { score, label: 'Good',      color: '#F59E0B' };
  if (score === 4) return { score, label: 'Strong',    color: 'var(--success-dark)' };
  return               { score, label: 'Very Strong', color: 'var(--green-700)' };
}

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const { score, label, color } = getStrength(password);
  const pct = Math.min(100, (score / 5) * 100);

  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className={styles.label} style={{ color }}>{label}</span>
    </div>
  );
}
