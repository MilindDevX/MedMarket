import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, CheckCircle, ShieldCheck, MapPin } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import GoogleSignInButton from '../../components/ui/GoogleSignInButton';
import styles from './ConsumerSignup.module.css';

const STEPS = ['Account', 'Personal', 'Location'];

function isRealEmail(email) {
  return /^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/.test(email)
    && !email.includes('..')
    && email.split('@')[0].length >= 2
    && email.split('@')[1].split('.')[0].length >= 2;
}

function isRealName(name) {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  return (trimmed.match(/\p{L}/gu) || []).length >= 2;
}

function Field({ label, id, type = 'text', value, onChange, error, placeholder, suffix }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={styles.inputWrap}>
        <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={id}
          className={`${styles.input} ${error ? styles.inputError : ''}`} />
        {suffix}
      </div>
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
}

export default function ConsumerSignup() {
  usePageTitle('Create Account');
  const navigate = useNavigate();
  const { register, googleLogin } = useAuthStore();

  const [step,         setStep]         = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [errors,       setErrors]       = useState({});
  const [googleError,  setGoogleError]  = useState('');

  const [form, setForm] = useState({
    email: '', password: '', confirm: '',
    name: '', mobile: '',
    city: '', pincode: '', address: '',
  });

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '', submit: '' }));
  };

  const validate = () => {
    const errs = {};
    if (step === 0) {
      if (!isRealEmail(form.email))
        errs.email = 'Enter a valid email address (e.g. name@domain.com).';
      if (form.password.length < 8)
        errs.password = 'Password must be at least 8 characters.';
      if (!/[A-Z]/.test(form.password))
        errs.password = 'Password must contain at least one uppercase letter.';
      if (!/[0-9]/.test(form.password))
        errs.password = 'Password must contain at least one number.';
      if (form.password !== form.confirm)
        errs.confirm = 'Passwords do not match.';
    }
    if (step === 1) {
      if (!isRealName(form.name))
        errs.name = 'Enter your real full name (at least 2 letters).';
      if (!form.mobile.match(/^[6-9]\d{9}$/))
        errs.mobile = 'Enter a valid 10-digit Indian mobile number.';
    }
    if (step === 2) {
      if (!form.city.trim())
        errs.city = 'City is required.';
      if (!form.pincode.match(/^\d{6}$/))
        errs.pincode = 'Enter a valid 6-digit PIN code.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validate()) setStep(s => s + 1); };
  const handleBack = () => { setStep(s => s - 1); setErrors({}); };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        mobile:   form.mobile,
        password: form.password,
        role:     'consumer',
      });
      navigate('/consumer/home');
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('email') || msg.includes('409') || msg.includes('already')) {
        setStep(0);
        setErrors({ submit: msg });
      } else {
        setErrors({ submit: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken) => {
    setGoogleError('');
    try {
      await googleLogin(accessToken, 'consumer');
      navigate('/consumer/home');
    } catch (err) {
      setGoogleError(err.message || 'Google sign-up failed. Please try again.');
    }
  };

  const eyeBtn = (show, toggle) => (
    <button type="button" className={styles.eyeBtn} onClick={toggle}>
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className={styles.page}>
      <div className={styles.leftPane}>
        <div className={styles.leftInner}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandDot} />
            <span className={styles.brandName}>MedMarket India</span>
          </Link>
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
            <h1 className={styles.leftTitle}>Your medicines,<br />delivered fast.</h1>
            <p className={styles.leftSub}>Join thousands of patients getting genuine OTC medicines from verified pharmacies near them.</p>
          </motion.div>
          <div className={styles.benefits}>
            {[
              { icon: ShieldCheck, text: 'Only CDSCO-verified pharmacies' },
              { icon: CheckCircle, text: 'DPCO-compliant pricing — no overcharging' },
              { icon: MapPin,      text: 'Stores near you, delivery in 30–60 min' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className={styles.benefitRow}>
                <Icon size={15} strokeWidth={2} className={styles.benefitIcon} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.rightPane}>
        <div className={styles.formCard}>
          <div className={styles.stepBar}>
            {STEPS.map((s, i) => (
              <div key={s} className={styles.stepItem}>
                <div className={`${styles.stepDot} ${i < step ? styles.stepDone : i === step ? styles.stepActive : styles.stepPending}`}>
                  {i < step ? <CheckCircle size={14} strokeWidth={2.5} /> : i + 1}
                </div>
                <span className={`${styles.stepLabel} ${i === step ? styles.stepLabelActive : ''}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={styles.stepLine} />}
              </div>
            ))}
          </div>

          <AnimatePresence>
            {errors.submit && (
              <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{ background:'var(--danger-light)', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--danger)', marginBottom:'var(--sp-3)', fontWeight:500 }}>
                {errors.submit}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-24 }} transition={{ type:'spring', stiffness:320, damping:28 }}>
                <h2 className={styles.stepTitle}>Create your account</h2>
                <p className={styles.stepSub}>Start with Google or use your email</p>

                <div style={{ marginBottom: 'var(--sp-4)' }}>
                  <GoogleSignInButton
                    onSuccess={handleGoogleSuccess}
                    onError={msg => setGoogleError(msg)}
                    label="Sign up with Google"
                  />
                  {googleError && (
                    <p style={{ fontSize:12, color:'var(--danger)', marginTop:6, fontWeight:500 }}>{googleError}</p>
                  )}
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', marginBottom:'var(--sp-4)' }}>
                  <div style={{ flex:1, height:1, background:'var(--ink-200)' }} />
                  <span style={{ fontSize:12, color:'var(--ink-400)', fontWeight:500 }}>or sign up with email</span>
                  <div style={{ flex:1, height:1, background:'var(--ink-200)' }} />
                </div>

                <div className={styles.fields}>
                  <Field id="email" label="Email address" type="email"
                    value={form.email} onChange={v => setField('email', v)}
                    placeholder="priya@example.com" error={errors.email} />
                  <Field id="password" label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={v => setField('password', v)}
                    placeholder="Min. 8 chars, 1 uppercase, 1 number" error={errors.password}
                    suffix={eyeBtn(showPassword, () => setShowPassword(s => !s))} />
                  <Field id="confirm" label="Confirm password"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm} onChange={v => setField('confirm', v)}
                    placeholder="Re-enter password" error={errors.confirm}
                    suffix={eyeBtn(showConfirm, () => setShowConfirm(s => !s))} />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-24 }} transition={{ type:'spring', stiffness:320, damping:28 }}>
                <h2 className={styles.stepTitle}>Your details</h2>
                <p className={styles.stepSub}>So pharmacies know who's placing the order</p>
                <div className={styles.fields}>
                  <Field id="name" label="Full name"
                    value={form.name} onChange={v => setField('name', v)}
                    placeholder="Priya Sharma" error={errors.name} />
                  <Field id="mobile" label="Mobile number" type="tel"
                    value={form.mobile} onChange={v => setField('mobile', v)}
                    placeholder="10-digit number, e.g. 9876543210" error={errors.mobile} />
                </div>
                <p className={styles.noteText}>Your mobile number will be shared with the pharmacy for delivery coordination.</p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-24 }} transition={{ type:'spring', stiffness:320, damping:28 }}>
                <h2 className={styles.stepTitle}>Your location</h2>
                <p className={styles.stepSub}>Used to find verified pharmacies near you</p>
                <div className={styles.fields}>
                  <Field id="city" label="City"
                    value={form.city} onChange={v => setField('city', v)}
                    placeholder="e.g. Sonipat" error={errors.city} />
                  <Field id="pincode" label="PIN code" type="tel"
                    value={form.pincode} onChange={v => setField('pincode', v)}
                    placeholder="6-digit PIN, e.g. 131001" error={errors.pincode} />
                  <Field id="address" label="Default address (optional)"
                    value={form.address} onChange={v => setField('address', v)}
                    placeholder="Street, Landmark" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.btnRow}>
            {step > 0 && (
              <button type="button" className={styles.backBtn} onClick={handleBack}>← Back</button>
            )}
            {step < 2 ? (
              <button type="button" className={styles.nextBtn} onClick={handleNext}>
                Continue <ArrowRight size={16} strokeWidth={2} />
              </button>
            ) : (
              <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : <><CheckCircle size={16} strokeWidth={2.5} /> Create Account</>}
              </button>
            )}
          </div>

          <div className={styles.footer}>
            <p className={styles.loginPrompt}>
              Already have an account?{' '}
              <Link to="/login" className={styles.loginLink}>Sign in →</Link>
            </p>
            <p className={styles.loginPrompt}>
              Own a pharmacy?{' '}
              <Link to="/pharmacy/register" className={styles.loginLink}>Register your store →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


