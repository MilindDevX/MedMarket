import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Package, Truck, MapPin, Clock, X, ChevronDown, ChevronUp } from 'lucide-react';
import { usePharmacyOrders } from '../../hooks/usePharmacyOrders';
import useToastStore from '../../store/toastStore';
import { SkeletonTable } from '../../components/ui/Skeleton';

const statusConfig = {
  confirmed:  { label:'New Order',  color:'var(--blue-700)',     bg:'#EFF6FF', actions:['accept','reject'] },
  accepted:   { label:'Accepted',   color:'var(--green-700)',    bg:'#F0FDF4', actions:['pack'] },
  packing:    { label:'Packing',    color:'var(--warning-dark)', bg:'#FFFBEB', actions:['dispatch'] },
  dispatched: { label:'Dispatched', color:'var(--green-700)',    bg:'#F0FDF4', actions:['deliver'] },
  delivered:  { label:'Delivered',  color:'var(--success-dark)', bg:'#ECFDF5', actions:[] },
  rejected:   { label:'Rejected',   color:'var(--danger)',       bg:'#FFF1F2', actions:[] },
  cancelled:  { label:'Cancelled',  color:'var(--danger)',       bg:'#FFF1F2', actions:[] },
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}

export default function PharmacyOrders() {
  usePageTitle('Orders');
  const [tab,         setTab]         = useState('active');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const toast = useToastStore();
  const { orders, loading, error, updateStatus } = usePharmacyOrders();

  const shown = orders.filter(o =>
    tab === 'active'
      ? !['delivered','rejected','cancelled'].includes(o.status)
      : ['delivered','rejected','cancelled'].includes(o.status)
  );

  const counts = {
    active: orders.filter(o => !['delivered','rejected','cancelled'].includes(o.status)).length,
    past:   orders.filter(o =>  ['delivered','rejected','cancelled'].includes(o.status)).length,
  };

  const advance = async (id, action) => {
    try {
      await updateStatus(id, action);
      const msgs = { accept:'Order accepted.', pack:'Packing started.', dispatch:'Order dispatched.', deliver:'Marked as delivered ✓' };
      toast.success(msgs[action] || 'Status updated.');
    } catch (err) {
      toast.error(err.message || 'Failed to update order.');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason.'); return; }
    try {
      await updateStatus(rejectModal.id, 'reject', rejectReason);
      toast.warning('Order rejected.');
      setRejectModal(null); setRejectReason('');
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <SkeletonTable rows={5} cols={4} />;
  if (error)   return <div style={{ color:'var(--danger)', padding:'var(--sp-6)' }}>Failed to load orders: {error}</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--sp-5)', flexWrap:'wrap', gap:'var(--sp-3)' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>Orders</h1>
          <p style={{ fontSize:13, color:'var(--ink-500)', marginTop:4 }}>{counts.active} active · {counts.past} past</p>
        </div>
        {/* Tab toggle */}
        <div style={{ display:'flex', background:'var(--ink-100)', borderRadius:10, padding:3, gap:2 }}>
          {[['active','Active'], ['past','Past Orders']].map(([key, lbl]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'var(--font-body)', transition:'all 0.15s',
                background: tab === key ? 'var(--white)' : 'transparent',
                color:      tab === key ? 'var(--ink-900)' : 'var(--ink-500)',
                boxShadow:  tab === key ? 'var(--shadow-sm)' : 'none',
              }}>
              {lbl} {tab === key && <span style={{ marginLeft:4, fontSize:11, fontWeight:700, color: key === 'active' ? 'var(--green-700)' : 'var(--ink-400)' }}>({counts[key]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {shown.length === 0 && (
        <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)', background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16 }}>
          <Clock size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)' }} />
          <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-600)', marginBottom:8 }}>
            {tab === 'active' ? 'No active orders right now' : 'No past orders yet'}
          </p>
          <p style={{ fontSize:13 }}>
            {tab === 'active' ? 'New orders will appear here as consumers place them.' : 'Completed and rejected orders will appear here.'}
          </p>
        </div>
      )}

      {/* Orders */}
      <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
        {shown.map((order, i) => {
          const { label, color, bg, actions } = statusConfig[order.status] || statusConfig.confirmed;
          const isPast = tab === 'past';

          return (
            <motion.div key={order.id}
              style={{ background:'var(--white)', border:`1px solid var(--ink-200)`, borderRadius:16, overflow:'hidden',
                opacity: isPast ? 0.9 : 1,
                borderLeft: isPast ? `4px solid ${color}` : undefined }}
              initial={{ opacity:0, y:8 }} animate={{ opacity: isPast ? 0.9 : 1, y:0 }}
              transition={{ delay:i*0.04 }}>

              {/* New order highlight */}
              {order.status === 'confirmed' && (
                <div style={{ background:'var(--blue-700)', padding:'4px 16px', fontSize:11, fontWeight:700, color:'#FFFFFF', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:6 }}>
                  🔔 NEW ORDER — ACTION REQUIRED
                </div>
              )}

              <div style={{ padding:'var(--sp-4) var(--sp-5)' }}>
                {/* Top row */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'var(--sp-3)', marginBottom:'var(--sp-3)' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', marginBottom:4 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)', fontFamily:'monospace' }}>
                        #{order.id?.slice(0,8).toUpperCase()}
                      </span>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:9999, color, background:bg }}>
                        {label}
                      </span>
                    </div>
                    <div style={{ fontSize:13, color:'var(--ink-600)', fontWeight:500 }}>
                      {order.consumer?.name}
                      {order.consumer?.mobile && <span style={{ color:'var(--ink-400)', marginLeft:8 }}>{order.consumer.mobile}</span>}
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink-400)', marginTop:2 }}>
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:18, fontWeight:700, color:'var(--ink-900)' }}>
                      ₹{Number(order.total_amount).toFixed(0)}
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink-400)', marginTop:2 }}>
                      {order.delivery_type} · {order.payment_method?.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Items chips */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--sp-2)', marginBottom:'var(--sp-3)' }}>
                  {order.items?.length > 0
                    ? order.items.map(item => (
                        <span key={item.id} style={{ fontSize:12, fontWeight:600, padding:'3px 10px', background:'var(--ink-50)', border:'1px solid var(--ink-200)', borderRadius:'var(--r-full)', color:'var(--ink-700)' }}>
                          {item.medicine_name} × {item.quantity}
                        </span>
                      ))
                    : <span style={{ fontSize:12, color:'var(--ink-400)' }}>No items loaded</span>
                  }
                </div>

                {/* Address (collapsed by default) */}
                {order.delivery_address && (
                  <div style={{ fontSize:12, color:'var(--ink-500)', marginBottom:'var(--sp-3)', display:'flex', alignItems:'flex-start', gap:5 }}>
                    <MapPin size={12} strokeWidth={2} style={{ flexShrink:0, marginTop:1, color:'var(--ink-400)' }} />
                    {typeof order.delivery_address === 'string' ? order.delivery_address : JSON.stringify(order.delivery_address)}
                  </div>
                )}

                {/* Action buttons */}
                {!isPast && actions.length > 0 && (
                  <div style={{ display:'flex', gap:'var(--sp-2)', flexWrap:'wrap', paddingTop:'var(--sp-3)', borderTop:'1px solid var(--ink-100)' }}>
                    {actions.includes('accept') && (
                      <button onClick={() => advance(order.id, 'accept')}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 16px', background:'var(--green-700)', color:'#FFFFFF', border:'none', borderRadius:'var(--r-md)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        <CheckCircle size={14} strokeWidth={2.5} /> Accept
                      </button>
                    )}
                    {actions.includes('pack') && (
                      <button onClick={() => advance(order.id, 'pack')}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 16px', background:'var(--green-700)', color:'#FFFFFF', border:'none', borderRadius:'var(--r-md)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        <Package size={14} strokeWidth={2.5} /> Start Packing
                      </button>
                    )}
                    {actions.includes('dispatch') && (
                      <button onClick={() => advance(order.id, 'dispatch')}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 16px', background:'var(--blue-700)', color:'#FFFFFF', border:'none', borderRadius:'var(--r-md)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        <Truck size={14} strokeWidth={2.5} /> Mark Dispatched
                      </button>
                    )}
                    {actions.includes('deliver') && (
                      <button onClick={() => advance(order.id, 'deliver')}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 16px', background:'var(--success-dark)', color:'#FFFFFF', border:'none', borderRadius:'var(--r-md)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        <CheckCircle size={14} strokeWidth={2.5} /> Delivered
                      </button>
                    )}
                    {actions.includes('reject') && (
                      <button onClick={() => setRejectModal(order)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 16px', background:'var(--white)', color:'var(--danger)', border:'1.5px solid #FECACA', borderRadius:'var(--r-md)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        <XCircle size={14} strokeWidth={2.5} /> Reject
                      </button>
                    )}
                  </div>
                )}

                {/* Past: show rejection reason */}
                {isPast && order.rejection_reason && (
                  <div style={{ marginTop:'var(--sp-3)', padding:'var(--sp-3)', background:'#FFF1F2', borderRadius:8, fontSize:12, color:'var(--danger)' }}>
                    <strong>Rejection reason:</strong> {order.rejection_reason}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setRejectModal(null)}>
            <motion.div style={{ background:'var(--white)', borderRadius:20, width:'100%', maxWidth:420, padding:'var(--sp-5)', boxShadow:'var(--shadow-lg)' }}
              initial={{ scale:0.93, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--ink-900)' }}>Reject Order</h3>
                <button onClick={() => setRejectModal(null)} style={{ display:'flex', padding:4, color:'var(--ink-400)', borderRadius:6, background:'none', border:'none', cursor:'pointer' }}><X size={18}/></button>
              </div>
              <p style={{ fontSize:14, color:'var(--ink-600)', marginBottom:'var(--sp-4)' }}>
                Order <strong>#{rejectModal?.id?.slice(0,8).toUpperCase()}</strong> — provide a reason so the customer is informed.
              </p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (required)…" rows={3}
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--ink-200)', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', resize:'vertical', outline:'none', boxSizing:'border-box', marginBottom:'var(--sp-4)' }} />
              <div style={{ display:'flex', gap:'var(--sp-3)' }}>
                <button onClick={() => setRejectModal(null)}
                  style={{ flex:1, padding:10, background:'var(--white)', color:'var(--ink-700)', border:'1px solid var(--ink-200)', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  Cancel
                </button>
                <button onClick={handleReject}
                  style={{ flex:1, padding:10, background:'var(--danger)', color:'var(--white)', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
