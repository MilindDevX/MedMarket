import usePageTitle from '../../utils/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, Phone, Mail, LogOut, AlertTriangle } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import styles from './PharmacyPending.module.css'; // reuse the same layout styles

export default function PharmacySuspended() {
  usePageTitle('Account Suspended');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandDot} style={{ background: 'var(--danger)' }} />
          <span className={styles.brandName}>MedMarket India</span>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={15} strokeWidth={1.8} /> Logout
        </button>
      </header>

      <div className={styles.content}>
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          style={{ borderColor: '#FECACA' }}
        >
          {/* Icon */}
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--sp-4)' }}>
            <ShieldOff size={32} strokeWidth={1.5} />
          </div>

          {/* Status tag */}
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--danger)', background: 'var(--danger-light)', border: '1px solid #FECACA', padding: '3px 12px', borderRadius: 9999, marginBottom: 'var(--sp-3)' }}>
            Account Suspended
          </div>

          <h1 className={styles.title}>Your store has been suspended</h1>
          <p className={styles.sub}>
            Hi <strong>{user?.name || 'there'}</strong>, your MedMarket pharmacy account has been suspended by our compliance team.
            All your listings are currently hidden from consumers and no new orders can be placed.
          </p>

          {/* What this means */}
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-5)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--sp-3)' }}>
              <AlertTriangle size={15} strokeWidth={2} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>What this means for your account</span>
            </div>
            {[
              'Your medicines are no longer visible to consumers',
              'New orders cannot be placed at your store',
              'In-progress orders that were accepted before suspension can still be fulfilled',
              'Your account data and inventory are safe and preserved',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < 3 ? 6 : 0 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0, marginTop: 6 }} />
                <span style={{ fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Next steps */}
          <div style={{ background: 'var(--ink-50)', border: '1px solid var(--ink-200)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-5)', textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 'var(--sp-2)' }}>Next steps</p>
            <p style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.6 }}>
              To resolve your suspension, contact our pharmacy support team. Please have your Drug License number and GST registration ready. Our team will explain the reason and guide you through the reinstatement process.
            </p>
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
            <div className={styles.contact}>
              <Phone size={14} strokeWidth={2} />
              <span>Pharmacy Support: <strong>1800-MED-CARE</strong> (9am–6pm, Mon–Sat)</span>
            </div>
            <div className={styles.contact}>
              <Mail size={14} strokeWidth={2} />
              <span>Email: <strong>pharmacy-support@medmarket.in</strong></span>
            </div>
          </div>

          {/* CTA */}
          <a
            href="mailto:pharmacy-support@medmarket.in?subject=Suspension+Review+Request"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '13px 0',
              background: 'var(--danger)', color: '#FFFFFF',
              border: 'none', borderRadius: 'var(--r-md)',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              textDecoration: 'none', fontFamily: 'var(--font-body)',
              transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='#DC2626'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='var(--danger)'; e.currentTarget.style.transform=''; }}
          >
            <Mail size={16} strokeWidth={2} /> Contact Support to Resolve
          </a>
        </motion.div>
      </div>
    </div>
  );
}
