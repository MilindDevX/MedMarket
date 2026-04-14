import usePageTitle from '../../utils/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, FileCheck, ShieldCheck, Phone, CheckCircle, LogOut } from 'lucide-react';
import { useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import styles from './PharmacyPending.module.css';

const steps = [
  { icon: FileCheck,   label: 'Application Submitted',       done: true },
  { icon: ShieldCheck, label: 'Document Verification',       done: false, active: true },
  { icon: CheckCircle, label: 'License Cross-check (CDSCO)', done: false },
  { icon: CheckCircle, label: 'GST Validation',              done: false },
  { icon: CheckCircle, label: 'Account Activated',           done: false },
];

export default function PharmacyPending() {
  usePageTitle('Application Pending');

  const { user, logout, pharmacyStatus } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (pharmacyStatus === 'approved') {
      navigate('/pharmacy/dashboard', { replace: true });
    }
    if (pharmacyStatus === 'rejected') {
      // Stay on this page — it will show rejected state
    }
  }, [pharmacyStatus, navigate]);

  // Poll every 15 seconds so approval redirect happens quickly
  useEffect(() => {
    const interval = setInterval(() => {
      useAuthStore.getState()._fetchPharmacyStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const isRejected = pharmacyStatus === 'rejected';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          <span className={styles.brandName}>MedMarket India</span>
        </div>
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
          <LogOut size={15} strokeWidth={1.8} /> Logout
        </button>
      </header>

      <div className={styles.content}>
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <motion.div
            className={styles.clockWrap}
            style={isRejected ? { background: 'var(--danger-light)', color: 'var(--danger)' } : {}}
            animate={isRejected ? {} : { rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <Clock size={32} strokeWidth={1.5} />
          </motion.div>

          <div className={styles.tag} style={isRejected ? { color: 'var(--danger)', background: 'var(--danger-light)', border: '1px solid #FECACA' } : {}}>
            {isRejected ? 'Application Rejected' : 'Under Review'}
          </div>

          <h1 className={styles.title}>
            {isRejected ? 'Your application was not approved' : 'Your application is being verified'}
          </h1>

          <p className={styles.sub}>
            {isRejected ? (
              <>Hi <strong>{user?.name || 'there'}</strong>, your application was reviewed and could not be approved at this time. Please check the reason below and resubmit with corrected documents.</>
            ) : (
              <>Hi <strong>{user?.name || 'there'}</strong>, our compliance team is reviewing your documents. This typically takes <strong>24–48 hours</strong>. This page refreshes automatically — you'll be redirected as soon as you're approved.</>
            )}
          </p>

          {!isRejected && (
            <div className={styles.stepsBox}>
              <div className={styles.stepsTitle}>Verification Progress</div>
              {steps.map(({ icon: Icon, label, done, active }, i) => (
                <motion.div
                  key={label}
                  className={`${styles.step} ${done ? styles.stepDone : active ? styles.stepActive : styles.stepPending}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={styles.stepIcon}><Icon size={14} strokeWidth={2} /></div>
                  <span className={styles.stepLabel}>{label}</span>
                  {done && <CheckCircle size={14} strokeWidth={2.5} className={styles.checkMark} />}
                  {active && (
                    <motion.span
                      className={styles.pulseDot}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          )}

          <div className={styles.contact}>
            <Phone size={14} strokeWidth={2} />
            <span>Questions? Call pharmacy support: <strong>1800-MED-CARE</strong> (9am–6pm, Mon–Sat)</span>
          </div>

          {isRejected && (
            <button
              className={styles.demoBtn}
              onClick={() => navigate('/pharmacy/register')}
              style={{ background: 'var(--green-700)', color: '#FFF', border: 'none', padding: '10px 24px', borderRadius: 'var(--r-md)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}>
              Resubmit Application →
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
