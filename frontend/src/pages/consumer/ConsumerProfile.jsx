import usePageTitle from '../../utils/usePageTitle';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Phone, Mail, Plus, Edit2, X, Check, Trash2, MessageSquare, Send, AlertCircle, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useToastStore from '../../store/toastStore';
import { useAddresses } from '../../hooks/useAddresses';
import { useOrders } from '../../hooks/useOrders';
import { useStores } from '../../hooks/useStores';
import { api } from '../../utils/api';
import styles from './ConsumerProfile.module.css';

export default function ConsumerProfile() {
  usePageTitle('My Profile');
  const { user } = useAuthStore();
  const toast    = useToastStore();
  const { addresses, loading: addrLoading, add, update, remove, setDefault } = useAddresses();
  const { orders } = useOrders();
  const { stores: allStores } = useStores('');

  // Unique stores the consumer has actually ordered from (for pharmacy complaints)
  const orderedStores = Array.from(
    new Map(
      orders
        .filter(o => o.store)
        .map(o => [o.store_id, { id: o.store_id, name: o.store?.name || 'Unknown Store' }])
    ).values()
  );

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddAddress,  setShowAddAddress]  = useState(false);
  const [editAddr,        setEditAddr]        = useState(null);

  const [name,   setName]   = useState(user?.name   || '');
  const [mobile, setMobile] = useState(user?.mobile || '');

  const [addrForm, setAddrForm] = useState({ label:'', address_line:'', city:'', pincode:'' });

  // My Complaints state
  const [myComplaints,     setMyComplaints]     = useState([]);
  const [complaintsLoading,setComplaintsLoading]= useState(false);
  const [showComplaintForm,setShowComplaintForm] = useState(false);
  const [complaintType,    setComplaintType]    = useState('');
  const [otherReason,      setOtherReason]      = useState('');
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintBody,    setComplaintBody]    = useState('');
  const [selectedStoreId,  setSelectedStoreId]  = useState('');
  const [filingComplaint,  setFilingComplaint]  = useState(false);
  const [expandedComplaint,setExpandedComplaint]= useState(null);

  const fetchMyComplaints = useCallback(() => {
    setComplaintsLoading(true);
    api.get('/consumer/complaints')
      .then(res => setMyComplaints(res.data || []))
      .catch(() => {})
      .finally(() => setComplaintsLoading(false));
  }, []);

  useEffect(() => { fetchMyComplaints(); }, [fetchMyComplaints]);

  const pharmacyComplaintTypes = [
    { value: 'rude_behaviour',   label: 'Rude or Unprofessional Behaviour' },
    { value: 'frequent_cancels', label: 'Frequent Order Cancellations'     },
    { value: 'high_pricing',     label: 'Prices Above MRP / Overcharging'  },
    { value: 'wrong_info',       label: 'Wrong Store Information Listed'   },
    { value: 'unlicensed',       label: 'Suspected Unlicensed Operation'   },
    { value: 'other',            label: 'Other'                            },
  ];

  const typeLabel = (v) => pharmacyComplaintTypes.find(x => x.value === v)?.label || v;

  const handleTypeChange = (t) => {
    setComplaintType(t);
    if (t !== 'other') setComplaintSubject(typeLabel(t));
    else { setComplaintSubject(''); setOtherReason(''); }
  };

  const handleFileComplaint = async () => {
    if (!complaintType)                                    { toast.error('Please select an issue type.'); return; }
    if (complaintType === 'other' && !otherReason.trim()) { toast.error('Please describe the issue.'); return; }
    if (!complaintBody.trim())                             { toast.error('Please describe the issue in detail.'); return; }
    if (!selectedStoreId)                                  { toast.error('Please select the pharmacy.'); return; }

    setFilingComplaint(true);
    try {
      await api.post('/consumer/complaints', {
        type:     complaintType,
        subject:  complaintType === 'other' ? otherReason.trim() : complaintSubject,
        body:     complaintBody,
        store_id: selectedStoreId,
        category: 'pharmacy',
      });
      toast.success('Complaint filed. Our team will review it within 24 hours.');
      setShowComplaintForm(false);
      setComplaintType(''); setOtherReason(''); setComplaintSubject(''); setComplaintBody(''); setSelectedStoreId('');
      fetchMyComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to file complaint.');
    } finally {
      setFilingComplaint(false);
    }
  };
  const setAF = (k, v) => setAddrForm(f => ({ ...f, [k]: v }));

  const openAddAddress  = ()     => { setAddrForm({ label:'', address_line:'', city:'', pincode:'' }); setEditAddr(null); setShowAddAddress(true); };
  const openEditAddress = (addr) => { setAddrForm({ label:addr.label, address_line:addr.address_line, city:addr.city, pincode:addr.pincode }); setEditAddr(addr); setShowAddAddress(true); };

  const handleSaveAddress = async () => {
    if (!addrForm.label || !addrForm.address_line || !addrForm.city || !addrForm.pincode) {
      toast.error('Please fill all address fields.'); return;
    }
    try {
      if (editAddr) { await update(editAddr.id, addrForm); toast.success('Address updated.'); }
      else          { await add(addrForm);                  toast.success('Address added.');   }
      setShowAddAddress(false);
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteAddress = async (id) => {
    try { await remove(id); toast.warning('Address removed.'); }
    catch (err) { toast.error(err.message); }
  };

  const handleSetDefault = async (id) => {
    try { await setDefault(id); toast.success('Default address updated.'); }
    catch (err) { toast.error(err.message); }
  };

  const [_savingProfile, setSavingProfile] = useState(false);
  const handleSaveProfile = async () => {
    if (!name.trim())             { toast.error('Name cannot be empty.'); return; }
    if (!/^\d{10}$/.test(mobile)) { toast.error('Enter a valid 10-digit mobile number.'); return; }
    setSavingProfile(true);
    try {
      await api.patch('/consumer/profile', { name, mobile });
      toast.success('Profile updated successfully.');
      setShowEditProfile(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const card = { background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:16 };

  return (
    <div className={styles.page}>
      {/* Profile header */}
      <motion.div style={{ ...card, padding:'var(--sp-6)', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', gap:'var(--sp-5)' }}
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ type:'spring', stiffness:280, damping:24 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--green-700)', color:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700, flexShrink:0 }}>
          {(user?.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>{user?.name}</div>
          <div style={{ display:'flex', gap:'var(--sp-4)', marginTop:6, flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'var(--ink-500)' }}>
              <Phone size={13} strokeWidth={2} /> {user?.mobile}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'var(--ink-500)' }}>
              <Mail size={13} strokeWidth={2} /> {user?.email}
            </span>
          </div>
        </div>
        <button onClick={() => setShowEditProfile(true)} className={styles.editBtn}>
          <Edit2 size={14} strokeWidth={2} /> Edit Profile
        </button>
      </motion.div>

      {/* Addresses */}
      <motion.div style={{ ...card, padding:'var(--sp-5)' }}
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08, type:'spring', stiffness:280, damping:24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)', display:'flex', alignItems:'center', gap:8 }}>
            <MapPin size={16} strokeWidth={1.8} style={{ color:'var(--green-700)' }} /> Saved Addresses
          </h2>
          <button onClick={openAddAddress} className={styles.addAddrBtn}>
            <Plus size={14} strokeWidth={2.5} /> Add address
          </button>
        </div>

        {addrLoading && <div style={{ color:'var(--ink-400)', fontSize:14, padding:'var(--sp-4)' }}>Loading addresses...</div>}

        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
          {addresses.map(addr => (
            <div key={addr.id} style={{ background: addr.is_default ? 'var(--green-50)' : 'var(--ink-50)', border:`1.5px solid ${addr.is_default ? 'var(--green-200)' : 'var(--ink-200)'}`, borderRadius:12, padding:'var(--sp-4)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'var(--sp-3)' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:700, color: addr.is_default ? 'var(--green-700)' : 'var(--ink-600)', background: addr.is_default ? 'var(--green-100)' : 'var(--ink-200)', padding:'1px 8px', borderRadius:9999 }}>{addr.label}</span>
                  {addr.is_default && <span style={{ fontSize:11, fontWeight:600, color:'var(--green-700)' }}>✓ Default</span>}
                </div>
                <div style={{ fontSize:14, color:'var(--ink-800)' }}>{addr.address_line}</div>
                <div style={{ fontSize:13, color:'var(--ink-500)', marginTop:2 }}>{addr.city} — {addr.pincode}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr.id)} style={{ fontSize:11, fontWeight:600, color:'var(--green-700)', background:'none', border:'1px solid var(--green-300)', padding:'3px 9px', borderRadius:6, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                    Set default
                  </button>
                )}
                <button onClick={() => openEditAddress(addr)} style={{ display:'flex', padding:6, color:'var(--ink-400)', borderRadius:6, background:'none', border:'none', cursor:'pointer' }}>
                  <Edit2 size={13} strokeWidth={2} />
                </button>
                <button onClick={() => handleDeleteAddress(addr.id)} style={{ display:'flex', padding:6, color:'var(--ink-400)', borderRadius:6, background:'none', border:'none', cursor:'pointer' }}>
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
          {!addrLoading && addresses.length === 0 && (
            <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>
              No addresses saved yet.
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowEditProfile(false)}>
            <motion.div style={{ background:'#FFFFFF', borderRadius:20, width:'100%', maxWidth:420, boxShadow:'var(--shadow-lg)', overflow:'hidden' }}
              initial={{ scale:0.93, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--sp-4) var(--sp-5)', borderBottom:'1px solid #E5E7EB' }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--ink-900)' }}>Edit Profile</h3>
                <button onClick={() => setShowEditProfile(false)} style={{ display:'flex', padding:4, color:'var(--ink-400)', borderRadius:6 }}><X size={18} /></button>
              </div>
              <div style={{ padding:'var(--sp-5)', display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
                {[{ label:'Full Name', value:name, set:setName, type:'text' }, { label:'Mobile Number', value:mobile, set:setMobile, type:'tel' }].map(({ label, value, set, type }) => (
                  <div key={label}>
                    <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>{label}</label>
                    <input type={type} value={value} onChange={e => set(e.target.value)}
                      style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', outline:'none', color:'var(--ink-900)', boxSizing:'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'var(--sp-3)', padding:'var(--sp-4) var(--sp-5)', borderTop:'1px solid #E5E7EB' }}>
                <button onClick={() => setShowEditProfile(false)} style={{ flex:1, padding:10, background:'#FFFFFF', color:'var(--ink-700)', border:'1px solid #E5E7EB', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Cancel</button>
                <button onClick={handleSaveProfile} style={{ flex:1, padding:10, background:'var(--green-700)', color:'#FFFFFF', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Check size={15} strokeWidth={2.5} /> Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Complaints */}
      <motion.div style={{ ...card, padding:'var(--sp-5)', marginTop:'var(--sp-4)' }}
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.16, type:'spring', stiffness:280, damping:24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)', display:'flex', alignItems:'center', gap:8 }}>
            <MessageSquare size={16} strokeWidth={1.8} style={{ color:'var(--green-700)' }} /> My Complaints
          </h2>
          <button onClick={() => setShowComplaintForm(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'var(--warning-light)', color:'var(--warning-dark)', border:'1px solid #FDE68A', borderRadius:'var(--r-md)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
            <Plus size={14} strokeWidth={2.5} /> Pharmacy Complaint
          </button>
        </div>

        {complaintsLoading && <div style={{ fontSize:13, color:'var(--ink-400)', padding:'var(--sp-4)' }}>Loading complaints…</div>}

        {!complaintsLoading && myComplaints.length === 0 && (
          <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:13 }}>
            No complaints filed yet. To report an order issue, open the order and click "Report an Issue".
          </div>
        )}

        {!complaintsLoading && myComplaints.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
            {myComplaints.map(c => {
              const statusStyle = {
                open:      { color:'var(--blue-700)',     bg:'var(--blue-50)',       icon:<Clock size={12}/> },
                in_review: { color:'var(--warning-dark)', bg:'var(--warning-light)', icon:<Clock size={12}/> },
                resolved:  { color:'var(--success-dark)', bg:'var(--success-light)', icon:<CheckCircle size={12}/> },
                closed:    { color:'var(--ink-500)',       bg:'var(--ink-100)',       icon:<CheckCircle size={12}/> },
              }[c.status] || { color:'var(--ink-500)', bg:'var(--ink-100)', icon:<Clock size={12}/> };
              const isExp = expandedComplaint === c.id;
              return (
                <div key={c.id} style={{ border:'1.5px solid var(--ink-200)', borderRadius:12, overflow:'hidden' }}>
                  <div onClick={() => setExpandedComplaint(isExp ? null : c.id)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--sp-3) var(--sp-4)', cursor:'pointer', background: isExp ? 'var(--ink-50)' : 'var(--white)' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{c.subject}</div>
                      <div style={{ fontSize:11, color:'var(--ink-400)', marginTop:2 }}>
                        {c.category === 'order' ? '📦 Order complaint' : '🏪 Pharmacy complaint'} · {new Date(c.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:statusStyle.color, background:statusStyle.bg, padding:'2px 8px', borderRadius:9999 }}>
                        {statusStyle.icon} {c.status?.replace('_',' ')}
                      </span>
                      {isExp ? <ChevronUp size={14} style={{ color:'var(--ink-400)' }}/> : <ChevronDown size={14} style={{ color:'var(--ink-400)' }}/>}
                    </div>
                  </div>
                  {isExp && (
                    <div style={{ padding:'var(--sp-3) var(--sp-4)', borderTop:'1px solid var(--ink-100)', background:'var(--ink-50)' }}>
                      <div style={{ fontSize:13, color:'var(--ink-700)', lineHeight:1.6, marginBottom: c.resolution ? 'var(--sp-3)' : 0 }}>{c.body}</div>
                      {c.resolution && (
                        <div style={{ background:'var(--success-light)', borderRadius:8, padding:'var(--sp-3)', fontSize:13, color:'var(--success-dark)' }}>
                          <strong>Resolution:</strong> {c.resolution}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Pharmacy Complaint Modal */}
      <AnimatePresence>
        {showComplaintForm && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowComplaintForm(false)}>
            <motion.div style={{ background:'#FFFFFF', borderRadius:20, width:'100%', maxWidth:460, boxShadow:'var(--shadow-lg)', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}
              initial={{ scale:0.93, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--sp-4) var(--sp-5)', borderBottom:'1px solid #E5E7EB' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
                  <AlertCircle size={20} strokeWidth={1.8} style={{ color:'var(--warning-dark)' }} />
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--ink-900)' }}>Pharmacy Complaint</h3>
                </div>
                <button onClick={() => setShowComplaintForm(false)} style={{ display:'flex', padding:4, color:'var(--ink-400)', borderRadius:6, background:'none', border:'none', cursor:'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ padding:'var(--sp-5)', display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
                <div style={{ background:'var(--blue-50)', border:'1px solid #BFDBFE', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--blue-700)' }}>
                  Pharmacy complaints are reviewed by the MedMarket admin team within 48 hours.
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>Which pharmacy? *</label>
                  <select value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)}
                    style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', outline:'none', color: selectedStoreId ? 'var(--ink-900)' : 'var(--ink-400)', background:'var(--white)' }}>
                    <option value=''>Select pharmacy…</option>
                    {(orderedStores.length > 0 ? orderedStores : allStores.map(s => ({ id:s.id, name:s.name }))).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>Issue Type *</label>
                  <select value={complaintType} onChange={e => handleTypeChange(e.target.value)}
                    style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', outline:'none', color:'var(--ink-900)', background:'var(--white)' }}>
                    <option value=''>Select issue…</option>
                    {pharmacyComplaintTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {complaintType === 'other' && (
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>Please specify *</label>
                    <input value={otherReason} onChange={e => setOtherReason(e.target.value)} placeholder="Briefly describe…"
                      style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', outline:'none', color:'var(--ink-900)', boxSizing:'border-box' }} />
                  </div>
                )}
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>Details *</label>
                  <textarea value={complaintBody} onChange={e => setComplaintBody(e.target.value)}
                    placeholder="Describe the issue in detail…" rows={4}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', resize:'vertical', outline:'none', boxSizing:'border-box', color:'var(--ink-900)' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:'var(--sp-3)', padding:'var(--sp-4) var(--sp-5)', borderTop:'1px solid #E5E7EB' }}>
                <button onClick={() => setShowComplaintForm(false)} style={{ flex:1, padding:10, background:'#FFFFFF', color:'var(--ink-700)', border:'1px solid #E5E7EB', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Cancel</button>
                <button onClick={handleFileComplaint} disabled={filingComplaint || !complaintType}
                  style={{ flex:1, padding:10, background:'var(--green-700)', color:'#FFFFFF', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: (filingComplaint || !complaintType) ? 'not-allowed' : 'pointer', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity: (filingComplaint || !complaintType) ? 0.7 : 1 }}>
                  <Send size={14} strokeWidth={2.5} /> {filingComplaint ? 'Filing…' : 'Submit Complaint'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Address Modal */}
      <AnimatePresence>
        {showAddAddress && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowAddAddress(false)}>
            <motion.div style={{ background:'#FFFFFF', borderRadius:20, width:'100%', maxWidth:440, boxShadow:'var(--shadow-lg)', overflow:'hidden' }}
              initial={{ scale:0.93, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--sp-4) var(--sp-5)', borderBottom:'1px solid #E5E7EB' }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--ink-900)' }}>{editAddr ? 'Edit Address' : 'Add New Address'}</h3>
                <button onClick={() => setShowAddAddress(false)} style={{ display:'flex', padding:4, color:'var(--ink-400)', borderRadius:6 }}><X size={18} /></button>
              </div>
              <div style={{ padding:'var(--sp-5)', display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
                {[
                  { label:'Label (e.g. Home, Work)', key:'label', placeholder:'Home' },
                  { label:'Full Address',             key:'address_line', placeholder:'Street, Landmark' },
                  { label:'City',                     key:'city',    placeholder:'Sonipat' },
                  { label:'PIN Code',                 key:'pincode', placeholder:'131001' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>{label}</label>
                    <input value={addrForm[key]} onChange={e => setAF(key, e.target.value)} placeholder={placeholder}
                      style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', outline:'none', color:'var(--ink-900)', boxSizing:'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'var(--sp-3)', padding:'var(--sp-4) var(--sp-5)', borderTop:'1px solid #E5E7EB' }}>
                <button onClick={() => setShowAddAddress(false)} style={{ flex:1, padding:10, background:'#FFFFFF', color:'var(--ink-700)', border:'1px solid #E5E7EB', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Cancel</button>
                <button onClick={handleSaveAddress} style={{ flex:1, padding:10, background:'var(--green-700)', color:'#FFFFFF', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Check size={15} strokeWidth={2.5} /> {editAddr ? 'Save Changes' : 'Add Address'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
