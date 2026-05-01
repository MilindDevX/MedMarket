import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CheckCircle, Clock, Package, Truck, MapPin, ArrowLeft, AlertCircle, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrder } from '../../hooks/useOrder';
import usePageTitle from '../../utils/usePageTitle';
import useToastStore from '../../store/toastStore';
import { api } from '../../utils/api';
import { SkeletonCard } from '../../components/ui/Skeleton';

const stages = [
  { key:'confirmed',  icon:CheckCircle, label:'Order Confirmed',   sub:'Payment received' },
  { key:'accepted',   icon:CheckCircle, label:'Accepted by Store', sub:'Pharmacy accepted your order' },
  { key:'packing',    icon:Package,     label:'Being Packed',      sub:'Your medicines are being packed' },
  { key:'dispatched', icon:Truck,       label:'Out for Delivery',  sub:'On the way to your address' },
  { key:'delivered',  icon:MapPin,      label:'Delivered',         sub:'Order completed' },
];

const stageIndex = { confirmed:0, accepted:1, packing:2, dispatched:3, delivered:4 };

// Complaint types filtered by order status
const orderComplaintTypes = [
  { value:'wrong_medicine',   label:'Wrong Medicine Delivered',  validFor:['delivered'] },
  { value:'expired_medicine', label:'Expired Medicine Received', validFor:['delivered'] },
  { value:'overcharged',      label:'Overcharged / Above MRP',   validFor:['delivered','accepted','packing','dispatched'] },
  { value:'late_delivery',    label:'Late Delivery',             validFor:['delivered','dispatched'] },
  { value:'other',            label:'Other',                     validFor:null },
];

const complainableStatuses = ['delivered','accepted','packing','dispatched','rejected'];

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const toast       = useToastStore();
  const { order, loading, error } = useOrder(orderId);
  usePageTitle(order ? `Order ${'#' + order.id?.slice(0,8).toUpperCase()}` : 'Order Tracking');

  const [showComplaint, setShowComplaint]   = useState(false);
  const [complaintType, setComplaintType]   = useState('');
  const [otherReason,   setOtherReason]     = useState('');
  const [complaintBody, setComplaintBody]   = useState('');
  const [filing,        setFiling]          = useState(false);

  const availableTypes = orderComplaintTypes.filter(t => {
    if (!t.validFor) return true;
    return t.validFor.includes(order?.status);
  });

  const typeLabel = (v) => orderComplaintTypes.find(t => t.value === v)?.label || v;

  const handleTypeChange = (v) => {
    setComplaintType(v);
    if (v === 'other') setOtherReason('');
  };

  const resetForm = () => {
    setComplaintType('');
    setOtherReason('');
    setComplaintBody('');
  };

  const handleFileComplaint = async () => {
    if (!complaintType)                            { toast.error('Please select a complaint type.'); return; }
    if (complaintType === 'other' && !otherReason.trim()) { toast.error('Please describe the issue.'); return; }
    if (!complaintBody.trim())                     { toast.error('Please provide details about the issue.'); return; }

    setFiling(true);
    try {
      await api.post('/consumer/complaints', {
        type:     complaintType,
        subject:  complaintType === 'other' ? otherReason.trim() : typeLabel(complaintType),
        body:     complaintBody,
        order_id: orderId,
        category: 'order',
      });
      toast.success('Complaint filed. Our team will review it within 24 hours.');
      setShowComplaint(false);
      resetForm();
    } catch (err) {
      toast.error(err.message || 'Failed to file complaint.');
    } finally {
      setFiling(false);
    }
  };

  if (loading) return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'var(--sp-6) var(--sp-5)' }}>
      <SkeletonCard lines={8} />
    </div>
  );

  if (error || !order) return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'var(--sp-6) var(--sp-5)', textAlign:'center', color:'var(--danger)' }}>
      {error || 'Order not found'}
    </div>
  );

  const currentStage = stageIndex[order.status] ?? 0;
  const cancelled    = ['cancelled','rejected'].includes(order.status);
  const canComplain  = complainableStatuses.includes(order.status);

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'var(--sp-6) var(--sp-5)' }}>
      <button onClick={() => navigate('/consumer/orders')}
        style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'var(--ink-500)', background:'none', border:'none', cursor:'pointer', marginBottom:'var(--sp-4)', padding:0 }}>
        <ArrowLeft size={15} strokeWidth={2} /> Back to orders
      </button>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'var(--sp-4)', marginBottom:'var(--sp-1)', flexWrap:'wrap' }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>
          Order Tracking
        </h1>
        {canComplain && (
          <button onClick={() => setShowComplaint(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--danger-light)', color:'var(--danger-dark)', border:'1px solid #FECACA', borderRadius:'var(--r-md)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', flexShrink:0 }}>
            <AlertCircle size={14} strokeWidth={2} /> Report an Issue
          </button>
        )}
      </div>
      <p style={{ fontSize:13, color:'var(--ink-400)', marginBottom:'var(--sp-6)', fontFamily:'monospace' }}>
        #{order.id?.slice(0,8).toUpperCase()} · {order.store?.name || ''}
      </p>

      {cancelled && (
        <div style={{ background:'var(--danger-light)', border:'1px solid #FECACA', borderRadius:12, padding:'var(--sp-4)', marginBottom:'var(--sp-5)', fontSize:14, color:'var(--danger-dark)', fontWeight:600 }}>
          This order was {order.status}.{order.rejection_reason ? ` Reason: ${order.rejection_reason}` : ''}
        </div>
      )}

      {/* Status stepper */}
      {!cancelled && (
        <div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-6)', marginBottom:'var(--sp-5)' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {stages.map(({ key, icon:Icon, label, sub }, i) => {
              const done   = i < currentStage;
              const active = i === currentStage;
              return (
                <div key={key} style={{ display:'flex', gap:'var(--sp-4)', alignItems:'flex-start', paddingBottom: i < stages.length-1 ? 'var(--sp-5)' : 0, position:'relative' }}>
                  {i < stages.length-1 && (
                    <div style={{ position:'absolute', left:17, top:36, bottom:0, width:2, background: done ? 'var(--green-700)' : 'var(--ink-200)', transition:'background 0.3s' }} />
                  )}
                  <div style={{ width:36, height:36, borderRadius:'50%', background: done ? 'var(--green-700)' : active ? 'var(--green-50)' : 'var(--ink-100)', border: active ? '2px solid var(--green-700)' : 'none', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, zIndex:1, transition:'all 0.3s' }}>
                    <Icon size={18} strokeWidth={2} style={{ color: done ? '#FFFFFF' : active ? 'var(--green-700)' : 'var(--ink-400)' }} />
                  </div>
                  <div style={{ paddingTop:4 }}>
                    <div style={{ fontSize:14, fontWeight: active || done ? 700 : 500, color: done || active ? 'var(--ink-900)' : 'var(--ink-400)' }}>{label}</div>
                    {(active || done) && <div style={{ fontSize:12, color:'var(--ink-500)', marginTop:2 }}>{sub}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order summary */}
      <div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' }}>
        <h2 style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)', marginBottom:'var(--sp-4)' }}>Order Summary</h2>
        {order.items?.map(item => (
          <div key={item.id} style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'var(--ink-700)', marginBottom:'var(--sp-2)' }}>
            <span>{item.medicine_name} × {item.quantity}</span>
            <span style={{ fontWeight:600 }}>₹{Number(item.line_total).toFixed(0)}</span>
          </div>
        ))}
        <div style={{ borderTop:'1px solid var(--ink-100)', marginTop:'var(--sp-3)', paddingTop:'var(--sp-3)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:700, color:'var(--ink-900)' }}>
            <span>Total</span>
            <span>₹{Number(order.total_amount).toFixed(0)}</span>
          </div>
          <div style={{ fontSize:12, color:'var(--ink-400)', marginTop:4 }}>
            Incl. GST ₹{Number(order.gst_amount).toFixed(0)} · {order.payment_method?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Complaint form modal */}
      <AnimatePresence>
        {showComplaint && (
          <motion.div
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => { setShowComplaint(false); resetForm(); }}>
            <motion.div
              style={{ background:'var(--white)', borderRadius:20, width:'100%', maxWidth:480, boxShadow:'var(--shadow-lg)', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}
              initial={{ scale:0.93, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--sp-4) var(--sp-5)', borderBottom:'1px solid #E5E7EB' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
                  <AlertCircle size={20} strokeWidth={1.8} style={{ color:'var(--warning-dark)' }} />
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--ink-900)' }}>Report an Issue</h3>
                </div>
                <button onClick={() => { setShowComplaint(false); resetForm(); }} style={{ display:'flex', padding:4, color:'var(--ink-400)', borderRadius:6, background:'none', border:'none', cursor:'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Pre-filled order context */}
              <div style={{ margin:'var(--sp-5) var(--sp-5) 0', background:'var(--ink-50)', borderRadius:10, padding:'var(--sp-3) var(--sp-4)', fontSize:13 }}>
                <div style={{ fontWeight:700, color:'var(--ink-700)', marginBottom:2 }}>Linked Order</div>
                <div style={{ fontFamily:'monospace', color:'var(--ink-500)', fontSize:12 }}>#{order.id?.slice(0,8).toUpperCase()} · {order.store?.name} · ₹{Number(order.total_amount).toFixed(0)}</div>
              </div>

              <div style={{ padding:'var(--sp-5)', display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
                {/* Type */}
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>Issue Type *</label>
                  <select value={complaintType} onChange={e => handleTypeChange(e.target.value)}
                    style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', outline:'none', color: complaintType ? 'var(--ink-900)' : 'var(--ink-400)', background:'var(--white)' }}>
                    <option value=''>Select issue type…</option>
                    {availableTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {order.status && (
                    <div style={{ fontSize:11, color:'var(--ink-400)', marginTop:4 }}>
                      Showing types available for a <strong>{order.status}</strong> order.
                    </div>
                  )}
                </div>

                {/* Other reason */}
                {complaintType === 'other' && (
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>Please specify *</label>
                    <input value={otherReason} onChange={e => setOtherReason(e.target.value)} placeholder="Briefly describe your issue…"
                      style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', outline:'none', color:'var(--ink-900)', boxSizing:'border-box' }} />
                  </div>
                )}

                {/* Details */}
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>Details *</label>
                  <textarea value={complaintBody} onChange={e => setComplaintBody(e.target.value)}
                    placeholder="Describe the issue in detail — what happened, when, which medicine…" rows={4}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', resize:'vertical', outline:'none', boxSizing:'border-box', color:'var(--ink-900)' }} />
                </div>
              </div>

              <div style={{ display:'flex', gap:'var(--sp-3)', padding:'var(--sp-4) var(--sp-5)', borderTop:'1px solid #E5E7EB' }}>
                <button onClick={() => { setShowComplaint(false); resetForm(); }}
                  style={{ flex:1, padding:10, background:'var(--white)', color:'var(--ink-700)', border:'1px solid #E5E7EB', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  Cancel
                </button>
                <button onClick={handleFileComplaint} disabled={filing || !complaintType}
                  style={{ flex:1, padding:10, background:'var(--danger)', color:'var(--white)', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: (filing || !complaintType) ? 'not-allowed' : 'pointer', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity: (filing || !complaintType) ? 0.7 : 1 }}>
                  <Send size={14} strokeWidth={2.5} /> {filing ? 'Filing…' : 'Submit Complaint'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
