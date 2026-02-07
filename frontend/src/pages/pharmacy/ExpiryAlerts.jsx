import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, Clock, X, Check, Tag, TrendingDown } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import useToastStore from '../../store/toastStore';
import { SkeletonCard } from '../../components/ui/Skeleton';

const expiryGroups = [
  { key:'expired',           icon:XCircle,       label:'Expired',              color:'var(--danger)',       bg:'#FFF1F1', border:'#FECACA' },
  { key:'expiring-critical', icon:AlertTriangle,  label:'Critical (< 30 days)', color:'var(--warning-dark)', bg:'#FFF7ED', border:'#FED7AA' },
  { key:'expiring-soon',     icon:Clock,          label:'Warning (30–60 days)', color:'#854D0E',             bg:'#FFFBEB', border:'#FDE68A' },
];

function getExpiryStatus(item) {
  const daysLeft = Math.floor((new Date(item.exp_date) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0)  return 'expired';
  if (daysLeft < 30) return 'expiring-critical';
  if (daysLeft < 60) return 'expiring-soon';
  return 'ok';
}

function daysUntil(exp_date) {
  return Math.floor((new Date(exp_date) - new Date()) / (1000 * 60 * 60 * 24));
}

export default function ExpiryAlerts() {
  usePageTitle('Expiry Alerts');
  const { inventory, loading, deleteItem, updateItem } = useInventory();
  const toast = useToastStore();

  const [discountTarget, setDiscountTarget] = useState(null);
  const [discountPrice,  setDiscountPrice]  = useState('');
  const [discounting,    setDiscounting]    = useState(false);
  const [removeTarget,   setRemoveTarget]   = useState(null);
  const [removing,       setRemoving]       = useState(false);

  if (loading) return <div><SkeletonCard lines={6} /></div>;

  const expiryItems  = inventory.filter(i => i.exp_date && getExpiryStatus(i) !== 'ok');
  const lowStockItems = inventory.filter(i =>
    i.quantity >= 0 &&
    i.quantity <= (i.low_stock_threshold || 10) &&
    i.status !== 'expired' &&
    getExpiryStatus(i) === 'ok'
  );
  const totalAlerts = expiryItems.length + lowStockItems.length;

  const openDiscount = (item) => {
    setDiscountTarget(item);
    setDiscountPrice(Math.max(1, Math.floor(Number(item.selling_price) * 0.9)).toString());
  };

  const handleApplyDiscount = async () => {
    if (!discountPrice || isNaN(Number(discountPrice)) || Number(discountPrice) <= 0) {
      toast.error('Enter a valid price.'); return;
    }
    if (Number(discountPrice) > Number(discountTarget.medicine?.mrp || 9999)) {
      toast.error(`Price cannot exceed MRP (₹${discountTarget.medicine?.mrp}).`); return;
    }
    setDiscounting(true);
    try {
      await updateItem(discountTarget.id, { selling_price: Number(discountPrice) });
      toast.success(`Discount applied — ${discountTarget.medicine?.name} now ₹${discountPrice}`);
      setDiscountTarget(null);
    } catch (err) {
      toast.error(err.message || 'Failed to apply discount.');
    } finally {
      setDiscounting(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await deleteItem(removeTarget.id);
      toast.warning(`${removeTarget.medicine?.name} (Batch ${removeTarget.batch_number}) removed.`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err.message || 'Failed to remove stock.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px', marginBottom:'var(--sp-1)' }}>
        Expiry Alerts
      </h1>
      <p style={{ fontSize:14, color:'var(--ink-500)', marginBottom:'var(--sp-6)' }}>
        Medicines requiring immediate attention. Expired items are automatically hidden from consumers.
      </p>

      {totalAlerts === 0 && (
        <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)' }}>
          <AlertTriangle size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)' }} />
          <p style={{ fontSize:15 }}>No expiry alerts. All inventory is in good condition.</p>
        </div>
      )}

      {/* Expiry groups */}
      {expiryGroups.map(({ key, icon:Icon, label, color, bg, border }) => {
        const items = expiryItems.filter(i => getExpiryStatus(i) === key);
        if (!items.length) return null;
        return (
          <div key={key} style={{ marginBottom:'var(--sp-6)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', marginBottom:'var(--sp-3)' }}>
              <Icon size={16} strokeWidth={2} style={{ color }} />
              <h2 style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)' }}>{label}</h2>
              <span style={{ fontSize:12, fontWeight:600, color, background:bg, border:`1px solid ${border}`, padding:'2px 8px', borderRadius:9999 }}>{items.length}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'var(--sp-3)' }}>
              {items.map((item, i) => (
                <motion.div key={item.id}
                  style={{ background:bg, border:`1px solid ${border}`, borderRadius:12, padding:'var(--sp-4)' }}
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)', marginBottom:4 }}>{item.medicine?.name}</div>
                  <div style={{ fontSize:12, color:'var(--ink-500)', fontFamily:'monospace', marginBottom:'var(--sp-3)' }}>{item.batch_number}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--ink-700)', marginBottom:4 }}>
                    <span>EXP: <strong>{item.exp_date?.split('T')[0]}</strong></span>
                    <span><strong style={{ color: key === 'expired' ? 'var(--danger)' : 'inherit' }}>
                      {key === 'expired' ? `${Math.abs(daysUntil(item.exp_date))}d ago` : `${daysUntil(item.exp_date)}d left`}
                    </strong></span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--ink-700)', marginBottom:'var(--sp-3)' }}>
                    <span>{item.quantity} units · MRP ₹{item.medicine?.mrp}</span>
                    <span>Selling ₹{item.selling_price}</span>
                  </div>
                  <div style={{ display:'flex', gap:'var(--sp-2)' }}>
                    {key !== 'expired' && (
                      <button onClick={() => openDiscount(item)}
                        style={{ flex:1, padding:'7px', background:'var(--green-700)', color:'#FFF', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                        <Tag size={12} strokeWidth={2.5} /> Apply Discount
                      </button>
                    )}
                    <button onClick={() => setRemoveTarget(item)}
                      style={{ flex:1, padding:'7px', background:'#FFF', color:'#991B1B', border:'1px solid #FECACA', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                      Remove Stock
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Low stock section */}
      {lowStockItems.length > 0 && (
        <div style={{ marginBottom:'var(--sp-6)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', marginBottom:'var(--sp-3)' }}>
            <TrendingDown size={16} strokeWidth={2} style={{ color:'#7C3AED' }} />
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)' }}>Low Stock</h2>
            <span style={{ fontSize:12, fontWeight:600, color:'#7C3AED', background:'#F5F3FF', border:'1px solid #DDD6FE', padding:'2px 8px', borderRadius:9999 }}>{lowStockItems.length}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'var(--sp-3)' }}>
            {lowStockItems.map((item, i) => (
              <motion.div key={item.id}
                style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:12, padding:'var(--sp-4)' }}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)', marginBottom:4 }}>{item.medicine?.name}</div>
                <div style={{ fontSize:12, color:'var(--ink-500)', fontFamily:'monospace', marginBottom:'var(--sp-3)' }}>{item.batch_number}</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--ink-700)', marginBottom:4 }}>
                  <span>Stock: <strong style={{ color:'#7C3AED' }}>{item.quantity} units</strong></span>
                  <span>Threshold: {item.low_stock_threshold || 10}</span>
                </div>
                <div style={{ fontSize:13, color:'var(--ink-500)', marginBottom:'var(--sp-3)' }}>
                  EXP: {item.exp_date?.split('T')[0]} · ₹{item.selling_price}
                </div>
                <div style={{ fontSize:12, color:'#6D28D9', background:'#EDE9FE', border:'1px solid #DDD6FE', borderRadius:6, padding:'6px 10px', fontWeight:600 }}>
                  Restock recommended
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Discount Modal */}
      <AnimatePresence>
        {discountTarget && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setDiscountTarget(null)}>
            <motion.div style={{ background:'#FFF', borderRadius:20, width:'100%', maxWidth:400, padding:'var(--sp-6)', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}
              initial={{ scale:0.93, y:16, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'var(--green-50)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Tag size={18} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>Apply Discount</div>
                </div>
                <button onClick={() => setDiscountTarget(null)} style={{ padding:4, color:'var(--ink-400)', borderRadius:6, background:'none', border:'none', cursor:'pointer' }}><X size={16}/></button>
              </div>
              <div style={{ background:'var(--ink-50)', borderRadius:10, padding:'var(--sp-3)', marginBottom:'var(--sp-4)' }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)' }}>{discountTarget.medicine?.name}</div>
                <div style={{ fontSize:12, color:'var(--ink-500)', marginTop:2 }}>
                  Batch {discountTarget.batch_number} · Expires {discountTarget.exp_date?.split('T')[0]} · {discountTarget.quantity} units
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-3)', marginBottom:'var(--sp-4)' }}>
                <div style={{ background:'var(--ink-50)', borderRadius:8, padding:'var(--sp-3)', textAlign:'center' }}>
                  <div style={{ color:'var(--ink-400)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>MRP</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--ink-900)', marginTop:2 }}>₹{discountTarget.medicine?.mrp}</div>
                </div>
                <div style={{ background:'var(--ink-50)', borderRadius:8, padding:'var(--sp-3)', textAlign:'center' }}>
                  <div style={{ color:'var(--ink-400)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Current</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--ink-900)', marginTop:2 }}>₹{discountTarget.selling_price}</div>
                </div>
              </div>
              <div style={{ marginBottom:'var(--sp-5)' }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>New selling price (₹)</label>
                <input type="number" value={discountPrice} onChange={e => setDiscountPrice(e.target.value)}
                  min="1" max={discountTarget.medicine?.mrp}
                  style={{ width:'100%', height:44, padding:'0 14px', border:'1.5px solid var(--ink-200)', borderRadius:10, fontSize:18, fontWeight:700, fontFamily:'var(--font-body)', outline:'none', color:'var(--ink-900)', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor='var(--green-700)'}
                  onBlur={e => e.target.style.borderColor='var(--ink-200)'} />
                {discountPrice && Number(discountTarget.medicine?.mrp) > 0 && (
                  <div style={{ fontSize:12, color:'var(--success-dark)', marginTop:6, fontWeight:600 }}>
                    {Math.round((1 - Number(discountPrice) / Number(discountTarget.medicine?.mrp)) * 100)}% discount from MRP
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:'var(--sp-3)' }}>
                <button onClick={() => setDiscountTarget(null)} style={{ flex:1, padding:11, background:'#FFF', color:'var(--ink-700)', border:'1px solid var(--ink-200)', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Cancel</button>
                <button onClick={handleApplyDiscount} disabled={discounting} style={{ flex:1, padding:11, background:'var(--green-700)', color:'#FFF', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: discounting ? 'not-allowed' : 'pointer', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity: discounting ? 0.7 : 1 }}>
                  {discounting ? 'Saving…' : <><Check size={15} strokeWidth={2.5}/> Apply Discount</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Confirm Modal */}
      <AnimatePresence>
        {removeTarget && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setRemoveTarget(null)}>
            <motion.div style={{ background:'#FFF', borderRadius:20, width:'100%', maxWidth:400, padding:'var(--sp-6)', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}
              initial={{ scale:0.93, y:16, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', marginBottom:'var(--sp-4)' }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'var(--danger-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <XCircle size={18} strokeWidth={1.8} style={{ color:'var(--danger)' }} />
                </div>
                <div style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>Remove Stock</div>
              </div>
              <div style={{ background:'#FFF1F1', border:'1px solid #FECACA', borderRadius:10, padding:'var(--sp-3)', marginBottom:'var(--sp-5)', fontSize:13, color:'#991B1B', lineHeight:1.6 }}>
                You're about to permanently remove <strong>{removeTarget.medicine?.name}</strong> (Batch: {removeTarget.batch_number}, {removeTarget.quantity} units). This cannot be undone.
              </div>
              <div style={{ display:'flex', gap:'var(--sp-3)' }}>
                <button onClick={() => setRemoveTarget(null)} style={{ flex:1, padding:11, background:'#FFF', color:'var(--ink-700)', border:'1px solid var(--ink-200)', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Keep It</button>
                <button onClick={handleRemove} disabled={removing} style={{ flex:1, padding:11, background:'var(--danger)', color:'#FFF', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: removing ? 'not-allowed' : 'pointer', fontFamily:'var(--font-body)', opacity: removing ? 0.7 : 1 }}>
                  {removing ? 'Removing…' : 'Yes, Remove'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
