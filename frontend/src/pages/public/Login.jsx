import usePageTitle from '../../utils/usePageTitle';
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Store, Shield, ArrowRight, Eye, EyeOff, Phone, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import GoogleSignInButton from '../../components/ui/GoogleSignInButton';
import styles from './Login.module.css';

const roles = [
  { id:'consumer',       icon:User,   label:'Patient',  sub:'Find & order medicines',  color:'var(--green-700)' },
  { id:'pharmacy_owner', icon:Store,  label:'Pharmacy', sub:'Manage your store',        color:'var(--blue-700)' },
  { id:'admin',          icon:Shield, label:'Admin',    sub:'Platform management',      color:'var(--ink-900)' },
];

export default function Login() {
  usePageTitle('Sign In');

  const [selectedRole,  setSelectedRole]  = useState(null);
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [isDeactivated, setIsDeactivated] = useState(false);

  const { login, googleLogin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Session-expiry flag — set by auth:navigate-login event from authStore
  const sessionExpired = location.state?.sessionExpired === true;

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    setIsDeactivated(false);
    setEmail('');
    setPassword('');
  };

  const doNavigate = (user) => {
    // Deep-link restore: if the user was redirected here from a protected route
    // (or after session expiry), send them back to that route after login.
    const from = location.state?.from;
    const safeTo = from && from !== '/login' && !from.startsWith('/login') ? from : null;

    if (user.role === 'consumer') {
      navigate(safeTo || '/consumer/home', { replace: true });
    } else if (user.role === 'pharmacy_owner') {
      const status = useAuthStore.getState().pharmacyStatus;
      if (status === 'pending' || status === 'rejected') navigate('/pharmacy/pending', { replace: true });
      else if (status === 'suspended') navigate('/pharmacy/suspended', { replace: true });
      else if (!status) navigate('/pharmacy/register', { replace: true });
      else navigate(safeTo || '/pharmacy/dashboard', { replace: true });
    } else {
      navigate(safeTo || '/admin/dashboard', { replace: true });
    }
  };

  // Listen for forced-logout navigation events dispatched by authStore
  useEffect(() => {
    const handler = (e) => {
      navigate('/login', {
        replace: true,
        state: { from: e.detail?.from || null, sessionExpired: true },
      });
    };
    window.addEventListener('auth:navigate-login', handler);
    return () => window.removeEventListener('auth:navigate-login', handler);
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedRole) { setError('Please select your role first.'); return; }
    if (!email || !password) { setError('Email and password are required.'); return; }

    setLoading(true);
    setError('');
    setIsDeactivated(false);

    try {
      const user = await login(email, password);
      const roleMatches = selectedRole === user.role;
      if (!roleMatches) {
        await useAuthStore.getState().logout();
        const roleLabel = { consumer:'Patient', pharmacy_owner:'Pharmacy', admin:'Admin' };
        setError(`This account is a ${roleLabel[user.role] || user.role} account. Please select the correct role.`);
        setLoading(false);
        return;
      }
      doNavigate(user);
    } catch (err) {
      if (err.message === 'DEACTIVATED') setIsDeactivated(true);
      else setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken) => {
    setError('');
    try {
      const { user, isNew } = await googleLogin(accessToken, selectedRole === 'pharmacy_owner' ? 'pharmacy_owner' : 'consumer');
      // New pharmacy owners go straight to registration — they have no store yet
      if (isNew && user.role === 'pharmacy_owner') {
        navigate('/pharmacy/register');
        return;
      }
      doNavigate(user);
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  const showGoogleButton = selectedRole === 'consumer' || selectedRole === 'pharmacy_owner';

  return (
    <div className={styles.page}>
      <div className={styles.leftPane}>
        <div className={styles.leftInner}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandDot} />
            <span className={styles.brandName}>MedMarket India</span>
          </Link>
          <motion.div className={styles.heroText} initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
            <h1>Welcome back</h1>
            <p>India's most trusted medicine marketplace. Log in to continue.</p>
          </motion.div>
          <div className={styles.trustPills}>
            {['CDSCO Verified','DPCO Compliant','GST Registered'].map(t => (
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

          {/* Session-expiry banner */}
          <AnimatePresence>
            {sessionExpired && (
              <motion.div
                initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{ display:'flex', alignItems:'flex-start', gap:10, background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:10, padding:'12px 14px', marginBottom:'var(--sp-4)', fontSize:13, color:'#92400E', lineHeight:1.5 }}
              >
                <AlertTriangle size={15} strokeWidth={2} style={{ flexShrink:0, marginTop:1 }} />
                <span><strong>Your session expired</strong> — please sign in again to continue.</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.roleGrid}>
            {roles.map(({ id, icon:Icon, label, sub, color }) => (
              <motion.button key={id}
                className={`${styles.roleCard} ${selectedRole === id ? styles.roleCardActive : ''}`}
                style={selectedRole === id ? { borderColor:color, background:`${color}12` } : {}}
                onClick={() => handleRoleSelect(id)}
                whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} type="button">
                {selectedRole === id && (
                  <div style={{ position:'absolute', top:8, right:8, color }}>
                    <CheckCircle2 size={14} strokeWidth={2.5} />
                  </div>
                )}
                <div className={styles.roleIcon} style={{ background:selectedRole===id ? `${color}18` : 'var(--ink-100)', color }}>
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div className={styles.roleLabel}>{label}</div>
                <div className={styles.roleSub}>{sub}</div>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {showGoogleButton && (
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{ marginTop:'var(--sp-4)' }}>
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={msg => setError(msg)}
                  label={`Continue with Google${selectedRole === 'pharmacy_owner' ? ' (Pharmacy)' : ''}`}
                />
                <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', margin:'var(--sp-4) 0' }}>
                  <div style={{ flex:1, height:1, background:'var(--ink-200)' }} />
                  <span style={{ fontSize:12, color:'var(--ink-400)', fontWeight:500 }}>or sign in with email</span>
                  <div style={{ flex:1, height:1, background:'var(--ink-200)' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedRole && (
              <motion.form className={styles.form} onSubmit={handleLogin}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:8 }} transition={{ type:'spring', stiffness:300, damping:24 }}>

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
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <AnimatePresence>
                  {isDeactivated && (
                    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                      style={{ background:'#FFF5F5', border:'1px solid #FECACA', borderRadius:10, padding:'var(--sp-4)' }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'var(--danger)', marginBottom:'var(--sp-3)' }}>
                        Your account has been deactivated.
                      </p>
                      <p style={{ fontSize:13, color:'#7F1D1D', lineHeight:1.6, marginBottom:'var(--sp-3)' }}>
                        Contact our support team to resolve this:
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


