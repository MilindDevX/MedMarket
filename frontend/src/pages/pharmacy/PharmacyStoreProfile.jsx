import usePageTitle from '../../utils/usePageTitle';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Phone, Mail, MapPin, Save, CheckCircle } from 'lucide-react';
import useToastStore from '../../store/toastStore';
import { usePharmacyStore } from '../../hooks/usePharmacyStore';
import { api } from '../../utils/api';
import { SkeletonCard } from '../../components/ui/Skeleton';

const Field = ({ label, value, onChange, placeholder, type = 'text', readonly }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)' }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} readOnly={readonly}
      style={{ height:42, padding:'0 14px', border:`1.5px solid ${readonly ? 'var(--ink-100)' : 'var(--ink-200)'}`, borderRadius:'var(--r-md)', fontSize:14, fontFamily:'var(--font-body)', outline:'none', background: readonly ? 'var(--ink-50)' : 'var(--white)', color: readonly ? 'var(--ink-400)' : 'var(--ink-900)', transition:'border-color 0.15s' }}
      onFocus={e => { if (!readonly) e.target.style.borderColor = 'var(--green-600)'; }}
      onBlur={e => e.target.style.borderColor = readonly ? 'var(--ink-100)' : 'var(--ink-200)'} />
    {readonly && <p style={{ fontSize:11, color:'var(--ink-400)', lineHeight:1.4 }}>Read-only — contact admin to update</p>}
  </div>
);

export default function PharmacyStoreProfile() {
  usePageTitle('Store Profile');
  const toast = useToastStore();
  const { store, loading, refetch } = usePharmacyStore();

  const [phone, setPhone]     = useState('');
  const [email, setEmail]     = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity]       = useState('');
  const [pincode, setPincode] = useState('');
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (store) {
      setPhone(store.phone || '');
      setEmail(store.email || '');
      setAddress(store.address_line || '');
      setCity(store.city || '');
      setPincode(store.pincode || '');
    }
  }, [store]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // PATCH /pharmacy/me — make sure backend has this route
      // If not, add to admin.routes: router.patch('/pharmacy/me', authenticate, updateMyStore)
      await api.patch('/pharmacy/me', { phone, email, address_line: address, city, pincode });
      toast.success('Store profile updated successfully.');
      if (refetch) refetch();
    } catch (err) {
      if (err.message?.includes('404') || err.message?.includes('not found') || err.message?.includes('JSON') || err.message?.includes('json')) {
        toast.error('Store profile update failed — the backend route PATCH /api/v1/pharmacy/me is not yet implemented. See BACKEND_FIXES.md #9.');
      } else {
        toast.error(err.message || 'Failed to save changes.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div><SkeletonCard lines={8} /></div>;

  if (!store) return (
    <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)' }}>
      <Store size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)' }} />
      <p>No store found. Please register your pharmacy first.</p>
    </div>
  );

  const statusColors = { approved:'var(--success-dark)', pending:'var(--warning-dark)', rejected:'var(--danger)', suspended:'var(--danger)' };
  const statusBg     = { approved:'var(--success-light)', pending:'var(--warning-light)', rejected:'var(--danger-light)', suspended:'var(--danger-light)' };

  return (
    <div style={{ maxWidth:800 }}>
      <motion.div style={{ background:'var(--always-dark)', borderRadius:16, padding:'var(--sp-6)', marginBottom:'var(--sp-5)' }}
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ type:'spring', stiffness:280, damping:22 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-4)' }}>
          <div style={{ width:56, height:56, borderRadius:14, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Store size={24} strokeWidth={1.5} style={{ color:'var(--always-white)' }} />
          </div>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, color:'var(--always-white)', letterSpacing:'-0.3px' }}>{store.name}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', marginTop:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, fontWeight:600, color: statusColors[store.status], background: statusBg[store.status], padding:'2px 10px', borderRadius:9999 }}>
                {store.status?.charAt(0).toUpperCase() + store.status?.slice(1)}
              </span>
              <span style={{ fontSize:12, color:'var(--always-sub)' }}>License: {store.drug_license_no}</span>
              <span style={{ fontSize:12, color:'var(--always-sub)' }}>GST: {store.gst_number}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-6)' }}
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08, type:'spring', stiffness:280, damping:22 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)', marginBottom:'var(--sp-5)' }}>Contact & Location</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-4)', marginBottom:'var(--sp-5)' }}>
          <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="98123 45678" />
          <Field label="Email Address" value={email} onChange={setEmail} placeholder="store@example.com" type="email" />
          <Field label="Address" value={address} onChange={setAddress} placeholder="Shop no., Street" />
          <Field label="City" value={city} onChange={setCity} placeholder="Sonipat" />
          <Field label="PIN Code" value={pincode} onChange={setPincode} placeholder="131001" />
          <Field label="State" value={store.state} readonly />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-4)', marginBottom:'var(--sp-6)', paddingTop:'var(--sp-4)', borderTop:'1px solid var(--ink-100)' }}>
          <Field label="Drug License No." value={store.drug_license_no} readonly />
          <Field label="GST Number" value={store.gst_number} readonly />
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 24px', background:'var(--green-700)', color:'#FFFFFF', border:'none', borderRadius:'var(--r-md)', fontSize:14, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'var(--font-body)', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : <><Save size={15} strokeWidth={2.5} /> Save Changes</>}
        </button>
      </motion.div>
    </div>
  );
}
