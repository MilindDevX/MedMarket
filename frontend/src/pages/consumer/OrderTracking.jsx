import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Package, Truck, MapPin, ArrowLeft } from 'lucide-react';
import { useOrder } from '../../hooks/useOrder';
import usePageTitle from '../../utils/usePageTitle';
import { SkeletonCard } from '../../components/ui/Skeleton';

const stages = [
  { key:'confirmed',  icon:CheckCircle, label:'Order Confirmed',   sub:'Payment received' },
  { key:'accepted',   icon:CheckCircle, label:'Accepted by Store', sub:'Pharmacy accepted your order' },
  { key:'packing',    icon:Package,     label:'Being Packed',      sub:'Your medicines are being packed' },
  { key:'dispatched', icon:Truck,       label:'Out for Delivery',  sub:'On the way to your address' },
  { key:'delivered',  icon:MapPin,      label:'Delivered',         sub:'Order completed' },
];

const stageIndex = { confirmed:0, accepted:1, packing:2, dispatched:3, delivered:4 };

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const { order, loading, error } = useOrder(orderId);
  usePageTitle(order ? `Order ${`#${order.id?.slice(0,8).toUpperCase()}`}` : 'Order Tracking');

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
  const cancelled = ['cancelled','rejected'].includes(order.status);

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'var(--sp-6) var(--sp-5)' }}>
      <button onClick={() => navigate('/consumer/orders')}
        style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'var(--ink-500)', background:'none', border:'none', cursor:'pointer', marginBottom:'var(--sp-4)', padding:0 }}>
        <ArrowLeft size={15} strokeWidth={2} /> Back to orders
      </button>

      <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px', marginBottom:'var(--sp-1)' }}>
        Order Tracking
      </h1>
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
    </div>
  );
}
