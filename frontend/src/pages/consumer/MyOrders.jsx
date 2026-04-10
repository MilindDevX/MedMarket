import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronRight, Store, X, XCircle } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import useToastStore from '../../store/toastStore';

const statusConfig = {
  confirmed:  { label:'Confirmed',      color:'var(--blue-700)',     bg:'var(--blue-50)',       cancelable:true  },
  accepted:   { label:'Accepted',       color:'var(--green-700)',    bg:'var(--green-50)',      cancelable:true  },
  packing:    { label:'Being Packed',   color:'var(--warning-dark)', bg:'var(--warning-light)', cancelable:true  },
  dispatched: { label:'On the Way',     color:'var(--green-700)',    bg:'var(--green-50)',      cancelable:false },
  delivered:  { label:'Delivered',      color:'var(--success-dark)', bg:'var(--success-light)', cancelable:false },
  rejected:   { label:'Rejected',       color:'var(--danger)',       bg:'var(--danger-light)',  cancelable:false },
  cancelled:  { label:'Cancelled',      color:'var(--danger)',       bg:'var(--danger-light)',  cancelable:false },
};

export default function MyOrders() {
  usePageTitle('My Orders');
  const [tab, setTab]                   = useState('active');
  const [cancelTarget, setCancelTarget] = useState(null);
  const navigate = useNavigate();
  const toast    = useToastStore();
  const { orders, loading, error, cancelOrder } = useOrders();

  const filtered = orders.filter(o =>
    tab === 'active'
      ? !['delivered','cancelled','rejected'].includes(o.status)
      : ['delivered','cancelled','rejected'].includes(o.status)
  );

  const handleCancel = async () => {
    try {
      await cancelOrder(cancelTarget.id);
      toast.warning(`Order ${cancelTarget.id} cancelled.`);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order.');
    } finally {
      setCancelTarget(null);
    }
  };

  const card = { background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' };

  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'var(--sp-6) var(--sp-5)' }}>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px', marginBottom:'var(--sp-5)' }}>
        My Orders
      </h1>

      <div style={{ display:'flex', gap:'var(--sp-2)', marginBottom:'var(--sp-5)' }}>
        {['active','past'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'8px 20px', borderRadius:'var(--r-md)', fontSize:14, fontWeight:600, cursor:'pointer', border:'1.5px solid', borderColor: tab===t ? 'var(--green-700)' : 'var(--ink-200)', background: tab===t ? 'var(--green-50)' : 'var(--white)', color: tab===t ? 'var(--green-700)' : 'var(--ink-500)', transition:'all 0.15s', fontFamily:'var(--font-body)' }}>
            {t === 'active' ? 'Active' : 'Past Orders'}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)' }}>
          Loading orders...
        </div>
      )}

      {error && (
        <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--danger)' }}>
          Failed to load orders. Please try again.
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'var(--sp-12)', color:'var(--ink-400)' }}>
          <Package size={40} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)' }} />
          <p style={{ fontSize:15 }}>No {tab} orders</p>
          {tab === 'active' && (
            <button onClick={() => navigate('/consumer/medicines')}
              style={{ marginTop:'var(--sp-4)', padding:'10px 24px', background:'var(--green-700)', color:'var(--white)', border:'none', borderRadius:'var(--r-md)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
              Browse Medicines
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
          {filtered.map((order, i) => {
            const { label, color, bg, cancelable } = statusConfig[order.status] || statusConfig.confirmed;
            return (
              <motion.div key={order.id} style={card}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
                whileHover={{ boxShadow:'var(--shadow-md)' }}>

                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--sp-3)' }}>
                  <div style={{ cursor:'pointer' }} onClick={() => navigate(`/consumer/orders/${order.id}`)}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-900)', fontFamily:'monospace' }}>{order.id}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', marginTop:4 }}>
                      <Store size={12} strokeWidth={2} style={{ color:'var(--green-700)' }} />
                      <span style={{ fontSize:13, color:'var(--ink-500)' }}>{order.store?.name || order.store_id}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
                    <span style={{ fontSize:11, fontWeight:600, color, background:bg, padding:'3px 9px', borderRadius:9999 }}>{label}</span>
                    <ChevronRight size={16} strokeWidth={2} style={{ color:'var(--ink-400)', cursor:'pointer' }}
                      onClick={() => navigate(`/consumer/orders/${order.id}`)} />
                  </div>
                </div>

                <div style={{ display:'flex', gap:'var(--sp-2)', flexWrap:'wrap', marginBottom:'var(--sp-3)' }}>
                  {order.items?.map(item => (
                    <span key={item.id} style={{ fontSize:12, color:'var(--ink-600)', background:'var(--ink-50)', border:'1px solid var(--ink-200)', padding:'3px 9px', borderRadius:9999 }}>
                      {item.medicine_name} × {item.quantity}
                    </span>
                  ))}
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:13, color:'var(--ink-400)' }}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
                    {cancelable && (
                      <button onClick={() => setCancelTarget(order)}
                        style={{ fontSize:12, fontWeight:600, color:'var(--danger)', background:'var(--danger-light)', border:'1px solid #FECACA', padding:'4px 12px', borderRadius:'var(--r-sm)', cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        Cancel
                      </button>
                    )}
                    <span style={{ fontWeight:700, color:'var(--ink-900)', fontSize:15 }}>₹{Number(order.total_amount).toFixed(0)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {cancelTarget && (
          <motion.div
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setCancelTarget(null)}>
            <motion.div
              style={{ background:'var(--white)', borderRadius:20, width:'100%', maxWidth:420, padding:'var(--sp-5)', boxShadow:'var(--shadow-lg)' }}
              initial={{ scale:0.93, opacity:0, y:16 }} animate={{ scale:1, opacity:1, y:0 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:'var(--danger-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <XCircle size={20} strokeWidth={1.8} style={{ color:'var(--danger)' }} />
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>Cancel Order?</div>
                </div>
                <button onClick={() => setCancelTarget(null)} style={{ color:'var(--ink-400)', display:'flex', padding:4, borderRadius:6 }}>
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
              <p style={{ fontSize:14, color:'var(--ink-600)', lineHeight:1.6, marginBottom:'var(--sp-5)' }}>
                Cancel order <strong>{cancelTarget?.id?.slice(0,8)}...</strong>? Refunds are processed within 3–5 business days for online payments.
              </p>
              <div style={{ display:'flex', gap:'var(--sp-3)' }}>
                <button onClick={() => setCancelTarget(null)}
                  style={{ flex:1, padding:10, background:'var(--white)', color:'var(--ink-700)', border:'1px solid var(--ink-200)', borderRadius:'var(--r-md)', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  Keep Order
                </button>
                <button onClick={handleCancel}
                  style={{ flex:1, padding:10, background:'var(--danger)', color:'var(--white)', border:'none', borderRadius:'var(--r-md)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
