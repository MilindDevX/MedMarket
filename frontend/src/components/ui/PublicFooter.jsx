import styles from './PublicFooter.module.css';

export default function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <span className={styles.brandDot} />
            <span className={styles.brandName}>MedMarket India</span>
          </div>
          <div className={styles.tagline}>
            India's CDSCO-compliant medicine marketplace. Verified pharmacies, transparent pricing, real-time tracking.
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© 2026 MedMarket India. All rights reserved.</span>
          <span>CDSCO Compliant · DPCO Enforced · GST Verified</span>
        </div>
      </div>
    </footer>
  );
}
