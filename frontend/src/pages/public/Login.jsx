import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Store, Shield, ArrowRight, Eye, EyeOff, Phone, Mail } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import styles from './Login.module.css';

const roles = [
  { id: 'consumer',       icon: User,   label: 'Patient',  sub: 'Find & order medicines', color: 'var(--green-700)' },
  { id: 'pharmacy_owner', icon: Store,  label: 'Pharmacy', sub: 'Manage your store',       color: 'var(--blue-700)' },
  { id: 'admin',          icon: Shield, label: 'Admin',    sub: 'Platform management',     color: 'var(--ink-900)' },
];

export default function Login() {
  usePageTitle('Sign In');

  const [selectedRole, setSelectedRole] = useState(null);
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [isDeactivated, setIsDeactivated] = useState(false);

  const { login } = useAuthStore();
  const navigate  = useNavigate();

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    setIsDeactivated(false);
    setEmail('');
    setPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedRole) { setError('Please select your role first.'); return; }
    if (!email || !password) { setError('Email and password are required.'); return; }

    setLoading(true);
    setError('');
    setIsDeactivated(false);

    try {
      const user = await login(email, password);

      const roleMatches = (
        (selectedRole === 'consumer'       && user.role === 'consumer') ||
        (selectedRole === 'pharmacy_owner' && user.role === 'pharmacy_owner') ||
        (selectedRole === 'admin'          && user.role === 'admin')
      );

      if (!roleMatches) {
        await useAuthStore.getState().logout();
        const roleLabel = { consumer:'Patient', pharmacy_owner:'Pharmacy', admin:'Admin' };
        setError(`This account is a ${roleLabel[user.role] || user.role} account. Please select the correct role.`);
        setLoading(false);
        return;
      }

      if (user.role === 'consumer') navigate('/consumer/home');
      else if (user.role === 'pharmacy_owner') {
        if (user.pharmacyStatus === 'pending') navigate('/pharmacy/pending');
        else navigate('/pharmacy/dashboard');
      }
      else navigate('/admin/dashboard');
    } catch (err) {
      if (err.message === 'DEACTIVATED') {
        setIsDeactivated(true);
        setError('');
      } else {
        setError(err.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPane}>
        <div className={styles.leftInner}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandDot} />
            <span className={styles.brandName}>MedMarket India</span>
          </Link>
          <motion.div className={styles.heroText}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1>Welcome back</h1>
            <p>India's most trusted medicine marketplace. Log in to continue.</p>
          </motion.div>
          <div className={styles.trustPills}>
            {['CDSCO Verified', 'DPCO Compliant', 'GST Registered'].map(t => (
              <span key={t} className={styles.trustPill}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.rightPane}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Sign in to your account</h2>
          <p className={styles.formSub}>
            New to MedMarket?{' '}
            <Link to="/signup" style={{ color:'var(--green-700)', fontWeight:700, textDecoration:'none' }}>
              Create a free account →
            </Link>
          </p>

          <div className={styles.roleGrid}>
            {roles.map(({ id, icon: Icon, label, sub, color }) => (
              <motion.button key={id}
                className={`${styles.roleCard} ${selectedRole === id ? styles.roleCardActive : ''}`}
                style={selectedRole === id ? { borderColor: color, background: `${color}08` } : {}}
                onClick={() => handleRoleSelect(id)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button">
                <div className={styles.roleIcon}
                  style={{ background: selectedRole === id ? `${color}15` : 'var(--ink-100)', color }}>
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div className={styles.roleLabel}>{label}</div>
                <div className={styles.roleSub}>{sub}</div>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {selectedRole && (
              <motion.form className={styles.form} onSubmit={handleLogin}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>

                <div className={styles.field}>
                  <label className={styles.label}>Email address</label>
                  <input type="email" className={styles.input} value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <div className={styles.passwordWrap}>
                    <input type={showPassword ? 'text' : 'password'} className={styles.input}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password" required />
                    <button type="button" className={styles.eyeBtn}
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {/* Deactivated account — show contact info instead of generic error */}
                <AnimatePresence>
                  {isDeactivated && (
                    <motion.div
                      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                      style={{ background:'#FFF5F5', border:'1px solid #FECACA', borderRadius:10, padding:'var(--sp-4)' }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'var(--danger)', marginBottom:'var(--sp-3)' }}>
                        Your account has been deactivated.
                      </p>
                      <p style={{ fontSize:13, color:'#7F1D1D', lineHeight:1.6, marginBottom:'var(--sp-3)' }}>
                        If you believe this is a mistake, please contact our support team:
                      </p>
                      <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
                        <a href="tel:18001234567" style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, color:'var(--danger)', textDecoration:'none' }}>
                          <Phone size={13} strokeWidth={2.5} /> 1800-123-4567 (toll-free, 9am–6pm)
                        </a>
                        <a href="mailto:support@medmarket.in" style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, color:'var(--danger)', textDecoration:'none' }}>
                          <Mail size={13} strokeWidth={2.5} /> support@medmarket.in
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : <>Sign in <ArrowRight size={16} strokeWidth={2} /></>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div style={{ borderTop:'1px solid var(--ink-100)', marginTop:'var(--sp-5)', paddingTop:'var(--sp-4)', display:'flex', flexDirection:'column', gap:8 }}>
            <p className={styles.registerPrompt}>
              New patient?{' '}
              <Link to="/signup" className={styles.registerLink}>Create a free account →</Link>
            </p>
            <p className={styles.registerPrompt}>
              Pharmacy owner?{' '}
              <Link to="/pharmacy/register" className={styles.registerLink}>Register your store →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
