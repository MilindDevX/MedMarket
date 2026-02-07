import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import useToastStore from '../../store/toastStore';
import { motion } from 'framer-motion';
import { Tag, Check, AlertTriangle, TrendingDown } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { SkeletonTable } from '../../components/ui/Skeleton';

export default function PharmacyPricing() {
  const toast = useToastStore();
  usePageTitle('Pricing Manager');

  const { inventory, loading, updateItem } = useInventory();
  const [prices, setPrices] = useState({});
  const [saved,  setSaved]  = useState({});

  const getPrice = (item) => prices[item.id] !== undefined ? prices[item.id] : Number(item.selling_price);

  const handleChange = (id, val) => {
    setPrices(p => ({ ...p, [id]: Number(val) }));
    setSaved(s => ({ ...s, [id]: false }));
  };

  const handleSave = async (item) => {
    const price = getPrice(item);
    if (price > Number(item.medicine?.mrp || 9999)) return;
    try {
      await updateItem(item.id, { selling_price: price });
      setSaved(s => ({ ...s, [item.id]: true }));
      toast.success('Price updated successfully.');
      setTimeout(() => setSaved(s => ({ ...s, [item.id]: false })), 2000);
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div><SkeletonTable rows={5} cols={5} /></div>;

  return (
    <div>
      <div style={{ marginBottom:'var(--sp-6)' }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>Pricing Manager</h1>
        <p style={{ fontSize:14, color:'var(--ink-500)', marginTop:4 }}>Set selling prices for your inventory. DPCO compliance: prices cannot exceed MRP.</p>
      </div>

      {inventory.length === 0 && (
        <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)' }}>
          <Tag size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)' }} />
          <p>No inventory found. Add medicines to manage pricing.</p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
        {inventory.map((item, i) => {
          const price   = getPrice(item);
          const mrp     = Number(item.medicine?.mrp || 0);
          const margin  = mrp > 0 ? ((mrp - price) / mrp * 100).toFixed(1) : 0;
          const isOver  = price > mrp;
          const isSaved = saved[item.id];

          return (
            <motion.div key={item.id}
              style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:12, padding:'var(--sp-4)', display:'flex', alignItems:'center', gap:'var(--sp-4)', flexWrap:'wrap' }}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}>

              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)' }}>{item.medicine?.name}</div>
                <div style={{ fontSize:12, color:'var(--ink-500)', marginTop:2 }}>{item.medicine?.salt_composition} · Batch {item.batch_number}</div>
              </div>

              <div style={{ textAlign:'center', minWidth:80 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-400)', textTransform:'uppercase', letterSpacing:'0.06em' }}>MRP</div>
                <div style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>₹{mrp}</div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
                <span style={{ fontSize:13, color:'var(--ink-500)' }}>₹</span>
                <input type="number" value={price} min={0} max={mrp}
                  onChange={e => handleChange(item.id, e.target.value)}
                  style={{ width:80, height:38, padding:'0 10px', border:`1.5px solid ${isOver ? 'var(--danger)' : 'var(--ink-200)'}`, borderRadius:'var(--r-md)', fontSize:15, fontWeight:600, fontFamily:'var(--font-body)', outline:'none', color:'var(--ink-900)' }}
                  onFocus={e => e.target.style.borderColor='var(--green-600)'}
                  onBlur={e => e.target.style.borderColor=isOver ? 'var(--danger)' : 'var(--ink-200)'} />
              </div>

              <div style={{ textAlign:'center', minWidth:80 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-400)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Discount</div>
                <div style={{ fontSize:13, fontWeight:600, color: margin > 0 ? 'var(--success-dark)' : 'var(--ink-500)', display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
                  {margin > 0 && <TrendingDown size={13} strokeWidth={2} />} {margin}%
                </div>
              </div>

              {isOver && (
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--warning-dark)', marginTop:2 }}>
                  <AlertTriangle size={13} strokeWidth={2} /> Exceeds MRP
                </div>
              )}

              <button onClick={() => handleSave(item)} disabled={isOver}
                style={{ padding:'8px 18px', background: isSaved ? 'var(--success)' : 'var(--green-700)', color:'#FFFFFF', border:'none', borderRadius:'var(--r-md)', fontSize:13, fontWeight:700, cursor: isOver ? 'not-allowed' : 'pointer', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', gap:6, opacity: isOver ? 0.5 : 1, transition:'background 0.2s' }}>
                {isSaved ? <><Check size={14} strokeWidth={2.5} /> Saved</> : 'Save'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
