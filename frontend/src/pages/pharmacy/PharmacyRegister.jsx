import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Upload, ArrowRight, ArrowLeft, Store, FileText, User, UserPlus, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useToastStore from '../../store/toastStore';
import { api } from '../../utils/api';
import styles from './PharmacyRegister.module.css';

const ALL_STEPS = [
  { id: 1, label: 'Create Account', icon: UserPlus },
  { id: 2, label: 'Store Details',  icon: Store },
  { id: 3, label: 'Documents',      icon: FileText },
  { id: 4, label: 'Owner Info',     icon: User },
];

const initialData = {
  // Step 1 — account
  accountName: '', accountEmail: '', accountMobile: '', accountPassword: '', accountConfirm: '',
  // Step 2 — store
  storeName: '', address: '', city: '', state: 'Haryana', pincode: '', phone: '', email: '',
  // Step 3 — documents
  drugLicenseNo: '', gstNumber: '', fssaiNo: '',
  // Step 4 — owner
  ownerName: '', ownerAadhaar: '', ownerPan: '', ownerMobile: '',
};

export default function PharmacyRegister() {
  usePageTitle('Register Your Pharmacy');

  const { user, register } = useAuthStore();
  const toast   = useToastStore();
  const navigate = useNavigate();

  // If already logged in as pharmacy_owner, skip Step 1
  const alreadyLoggedIn = user?.role === 'pharmacy_owner';
  const startStep = alreadyLoggedIn ? 2 : 1;
  const steps = alreadyLoggedIn ? ALL_STEPS.slice(1) : ALL_STEPS;

  const [step,      setStep]      = useState(startStep);
  const [data,      setData]      = useState(initialData);
  const [uploads,   setUploads]   = useState({ drugLicense:null, gst:null, aadhaar:null, storeFront:null });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const [showCf,    setShowCf]    = useState(false);

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    if (step === 1) {
      if (!data.accountName.trim() || data.accountName.trim().length < 2) {
        toast.error('Enter your full name.'); return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.accountEmail)) {
        toast.error('Enter a valid email address.'); return false;
      }
      if (!/^[6-9]\d{9}$/.test(data.accountMobile)) {
        toast.error('Enter a valid 10-digit Indian mobile number.'); return false;
      }
      if (data.accountPassword.length < 8) {
        toast.error('Password must be at least 8 characters.'); return false;
      }
      if (data.accountPassword !== data.accountConfirm) {
        toast.error('Passwords do not match.'); return false;
      }
    }
    if (step === 2) {
      if (!data.storeName.trim()) { toast.error('Store name is required.'); return false; }
      if (!data.address.trim())   { toast.error('Store address is required.'); return false; }
      if (!data.city.trim())      { toast.error('City is required.'); return false; }
      if (!/^\d{6}$/.test(data.pincode)) { toast.error('Enter a valid 6-digit PIN code.'); return false; }
      if (!/^\d{10}$/.test(data.phone.replace(/\s/g, ''))) { toast.error('Enter a valid 10-digit phone number.'); return false; }
    }
    if (step === 3) {
      if (!data.drugLicenseNo.trim()) { toast.error('Drug License Number is required.'); return false; }
      if (!data.gstNumber.trim())     { toast.error('GST Number is required.'); return false; }
      const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstPattern.test(data.gstNumber.toUpperCase())) {
        toast.error('GST Number format is invalid. Expected: 06AABCX1234D1Z5'); return false;
      }
    }
    if (step === 4) {
      if (!data.ownerName.trim()) { toast.error('Owner name is required.'); return false; }
      if (!/^\d{12}$/.test(data.ownerAadhaar.replace(/\s/g, ''))) {
        toast.error('Enter a valid 12-digit Aadhaar number.'); return false;
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(data.ownerPan)) {
        toast.error('Enter a valid PAN number (e.g. ABCDE1234F).'); return false;
      }
// ownerMobile now uses accountMobile from Step 1
    }
    return true;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!validate()) return;

    // Step 1 — create account first, get token, then proceed
    if (step === 1) {
      setLoading(true);
      try {
        await register({
          name:     data.accountName.trim(),
          email:    data.accountEmail.trim().toLowerCase(),
          mobile:   data.accountMobile,
          password: data.accountPassword,
          role:     'pharmacy_owner',
        });
        setStep(2);
      } catch (err) {
        toast.error(err.message || 'Failed to create account. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  // ── Submit store application ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/pharmacy', {
        name:            data.storeName,
        address_line:    data.address,
        city:            data.city,
        state:           data.state,
        pincode:         data.pincode,
        phone:           data.phone,
        email:           data.email || '',
        drug_license_no: data.drugLicenseNo,
        gst_number:      data.gstNumber,
        fssai_no:        data.fssaiNo || '',
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Store the file object for potential S3 upload, show name in UI
    setUploads(u => ({ ...u, [key]: file.name }));
    // Store actual file for future S3 upload
    setUploads(u => ({ ...u, [`${key}_file`]: file }));
  };

  const currentStepIndex = steps.findIndex(s => s.id === step);

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className={styles.successPage}>
        <motion.div className={styles.successCard}
          initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
          transition={{ type:'spring', stiffness:260, damping:22 }}>
          <div className={styles.successIcon}><CheckCircle size={40} strokeWidth={1.5} /></div>
          <h2>Application Submitted!</h2>
          <p>Your pharmacy registration is under review. Our team will verify your documents within 24–48 hours. You'll receive an SMS and email once approved.</p>
          <div className={styles.refCard}>
            <span className={styles.refLabel}>Reference</span>
            <span className={styles.refValue}>MMED-{new Date().getFullYear()}-{Math.floor(Math.random()*9000)+1000}</span>
          </div>
          <button className={styles.pendingBtn} onClick={() => navigate('/pharmacy/pending')}>
            Check Application Status <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Left panel */}
      <div className={styles.leftPanel}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandDot} /><span className={styles.brandName}>MedMarket India</span>
        </Link>
        <div className={styles.leftContent}>
          <h2 className={styles.leftTitle}>Join India's most trusted pharmacy network</h2>
          <p className={styles.leftSub}>Registration takes less than 5 minutes. Verification within 48 hours.</p>
          <div className={styles.stepList}>
            {steps.map(({ id, label, icon:Icon }) => (
              <div key={id} className={`${styles.stepItem} ${step===id ? styles.stepActive : ''} ${step>id ? styles.stepDone : ''}`}>
                <div className={styles.stepCircle}>
                  {step > id ? <CheckCircle size={16} strokeWidth={2.5} /> : <Icon size={16} strokeWidth={1.8} />}
                </div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepNum}>Step {alreadyLoggedIn ? id - 1 : id}</div>
                  <div className={styles.stepLabel}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.rightPanel}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width:`${((currentStepIndex + 1) / steps.length) * 100}%` }} />
        </div>

        <div className={styles.formWrap}>
          <div className={styles.stepHeader}>
            <span className={styles.stepCount}>Step {currentStepIndex + 1} of {steps.length}</span>
            <h3 className={styles.stepTitle}>{steps[currentStepIndex]?.label}</h3>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}>

              {/* ── Step 1 — Create Account ── */}
              {step === 1 && (
                <div className={styles.fields}>
                  <Field label="Full Name *" value={data.accountName} onChange={v => set('accountName', v)} placeholder="As per Aadhaar card" />
                  <Field label="Email Address *" value={data.accountEmail} onChange={v => set('accountEmail', v)} placeholder="you@example.com" type="email" />
                  <Field label="Mobile Number *" value={data.accountMobile} onChange={v => set('accountMobile', v)} placeholder="10-digit Indian mobile" type="tel" />
                  <div className={styles.field}>
                    <label className={styles.label}>Password * <span style={{ fontSize:11, fontWeight:400, color:'var(--ink-400)' }}>(min. 8 characters)</span></label>
                    <div style={{ position:'relative' }}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        className={styles.input}
                        value={data.accountPassword}
                        onChange={e => set('accountPassword', e.target.value)}
                        placeholder="Minimum 8 characters"
                      />
                      <button type="button" onClick={() => setShowPw(s => !s)}
                        style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', display:'flex', padding:2 }}>
                        {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Confirm Password *</label>
                    <div style={{ position:'relative' }}>
                      <input
                        type={showCf ? 'text' : 'password'}
                        className={styles.input}
                        value={data.accountConfirm}
                        onChange={e => set('accountConfirm', e.target.value)}
                        placeholder="Re-enter your password"
                      />
                      <button type="button" onClick={() => setShowCf(s => !s)}
                        style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', display:'flex', padding:2 }}>
                        {showCf ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize:12, color:'var(--ink-400)', lineHeight:1.6 }}>
                    This creates your pharmacy owner account. You'll use this email and password to log in after approval.
                  </p>
                </div>
              )}

              {/* ── Step 2 — Store Details ── */}
              {step === 2 && (
                <div className={styles.fields}>
                  <Field label="Store Name *"   value={data.storeName} onChange={v => set('storeName', v)} placeholder="e.g. Sharma Medical Store" />
                  <Field label="Store Address *" value={data.address}   onChange={v => set('address', v)}   placeholder="Shop No., Street, Area" />
                  <div className={styles.row2}>
                    <Field label="City *"     value={data.city}    onChange={v => set('city', v)}    placeholder="Sonipat" />
                    <Field label="PIN Code *" value={data.pincode} onChange={v => set('pincode', v)} placeholder="131001" />
                  </div>
                  <div className={styles.row2}>
                    <Field label="Store Phone *" value={data.phone} onChange={v => set('phone', v)} placeholder="98XXXXXXXX" type="tel" />
                    <Field label="Store Email"   value={data.email} onChange={v => set('email', v)} placeholder="store@email.com" type="email" />
                  </div>
                  <div className={styles.selectField}>
                    <label className={styles.label}>State *</label>
                    <select className={styles.select} value={data.state} onChange={e => set('state', e.target.value)}>
                      {['Haryana','Delhi','Uttar Pradesh','Punjab','Rajasthan','Maharashtra','Karnataka'].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* ── Step 3 — Documents ── */}
              {step === 3 && (
                <div className={styles.fields}>
                  <Field label="Drug License Number *"     value={data.drugLicenseNo} onChange={v => set('drugLicenseNo', v)} placeholder="HR-DL-20-2024-XXXXX" />
                  <Field label="GST Registration Number *" value={data.gstNumber}     onChange={v => set('gstNumber', v)}     placeholder="06AABCX1234D1Z5" />
                  <Field label="FSSAI License (optional)"  value={data.fssaiNo}       onChange={v => set('fssaiNo', v)}       placeholder="FSSAI License Number" />
                  <div className={styles.uploadSection}>
                    <div className={styles.uploadLabel}>Upload Documents <span style={{ fontSize:11, color:'var(--ink-400)' }}></span></div>
                    {[
                      { key:'drugLicense', label:'Drug License (Form 20/21) *' },
                      { key:'gst',         label:'GST Certificate *' },
                      { key:'aadhaar',     label:'Owner Aadhaar Card *' },
                      { key:'storeFront',  label:'Store Photographs *' },
                    ].map(({ key, label }) => (
                      <label key={key} className={`${styles.uploadBox} ${uploads[key] ? styles.uploadDone : ''}`} style={{ cursor:'pointer' }}><input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => handleFileUpload(key, e)} />
                        {uploads[key]
                          ? <><CheckCircle size={16} strokeWidth={2.5} style={{ color:'var(--green-700)' }} /><span className={styles.uploadFileName}>{uploads[key]}</span></>
                          : <><Upload size={16} strokeWidth={1.8} style={{ color:'var(--ink-400)' }} /><span>{label} — Click to upload</span></>}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 4 — Owner Info ── */}
              {step === 4 && (
                <div className={styles.fields}>
                  <Field label="Owner Full Name *" value={data.ownerName}    onChange={v => set('ownerName', v)}    placeholder="As per Aadhaar card" />
                  <div className={styles.row2}>
                    <Field label="Aadhaar Number *" value={data.ownerAadhaar} onChange={v => set('ownerAadhaar', v)} placeholder="XXXX XXXX XXXX" />
                    <Field label="PAN Number *"      value={data.ownerPan}    onChange={v => set('ownerPan', v)}     placeholder="ABCDE1234F" />
                  </div>
                  <div style={{ fontSize:13, color:'var(--ink-500)', background:'var(--ink-50)', border:'1px solid var(--ink-200)', borderRadius:8, padding:'var(--sp-3)' }}>
                    📱 Mobile: <strong>{data.accountMobile}</strong> (from your account)
                  </div>
                  <div className={styles.consentBox}>
                    <input type="checkbox" id="consent" defaultChecked />
                    <label htmlFor="consent" style={{ fontSize:13, color:'var(--ink-600)', lineHeight:1.5 }}>
                      I confirm that all information provided is accurate and I authorise MedMarket India to verify my Drug License and GST credentials with government databases.
                    </label>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div className={styles.navBtns}>
            {step > startStep && (
              <button className={styles.backBtn} onClick={handleBack} type="button">
                <ArrowLeft size={16} strokeWidth={2} /> Back
              </button>
            )}
            {step < 4 ? (
              <button className={styles.nextBtn} onClick={handleNext} type="button" disabled={loading}>
                {loading ? <span className={styles.spinner} /> : <>Continue <ArrowRight size={16} strokeWidth={2} /></>}
              </button>
            ) : (
              <button className={styles.nextBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : <>Submit Application <ArrowRight size={16} strokeWidth={2} /></>}
              </button>
            )}
          </div>

          <p className={styles.loginLink}>
            Already registered?{' '}
            <Link to="/login" style={{ color:'var(--green-700)', fontWeight:600 }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input type={type} className={styles.input} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
