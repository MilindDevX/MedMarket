import { useNavigate } from 'react-router-dom';
import usePageTitle from '../utils/usePageTitle';
import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function NotFound() {
  const navigate = useNavigate();
  usePageTitle('404 — Page Not Found');
  const { isAuthenticated, role } = useAuthStore();

  const handleHome = () => {
    if (!isAuthenticated) { navigate('/'); return; }
    if (role === 'pharmacy_owner') navigate('/pharmacy/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
    else navigate('/consumer/home');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--always-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-6)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Green blob */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '50%', height: '80%',
        background: 'radial-gradient(ellipse,rgba(12,107,78,0.15) 0%,transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        style={{ position: 'relative', textAlign: 'center', maxWidth: 480 }}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* 404 number */}
        <motion.div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(96px, 20vw, 160px)',
            fontWeight: 600,
            color: 'var(--green-700)',
            lineHeight: 1,
            letterSpacing: '-8px',
            marginBottom: 'var(--sp-3)',
            opacity: 0.85,
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.85 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        >
          404
        </motion.div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 600,
          color: 'var(--always-white)',
          letterSpacing: '-0.5px',
          marginBottom: 'var(--sp-3)',
        }}>
          Page not found
        </h1>

        <p style={{
          fontSize: 15,
          color: 'var(--always-sub)',
          lineHeight: 1.7,
          marginBottom: 'var(--sp-8)',
        }}>
          The page you're looking for doesn't exist or has been moved.
          It may have been a wrong link or an expired URL.
        </p>

        <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '11px 22px',
              background: 'rgba(255,255,255,0.07)',
              color: 'var(--always-white)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--r-md)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              transition: 'background var(--duration)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            <ArrowLeft size={16} strokeWidth={2} /> Go back
          </motion.button>

          <motion.button
            onClick={handleHome}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '11px 22px',
              background: 'var(--green-700)',
              color: 'var(--always-white)',
              border: 'none',
              borderRadius: 'var(--r-md)',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'background var(--duration)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--green-600)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--green-700)'}
          >
            <Home size={16} strokeWidth={2} /> Back to home
          </motion.button>
        </div>

        {/* Brand */}
        <div style={{ marginTop: 'var(--sp-10)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--always-sub)', fontWeight: 600 }}>MedMarket India</span>
        </div>
      </motion.div>
    </div>
  );
}
