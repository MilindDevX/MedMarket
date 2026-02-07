import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, ShieldCheck, ShoppingCart, ArrowLeft, AlertTriangle, X, Plus, Minus } from 'lucide-react';
import { useStoreDetail } from '../../hooks/useStoreDetail';
import useCartStore from '../../store/cartStore';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';

export default function StoreProfile() {
  usePageTitle('Store Profile');
  const { storeId } = useParams();
  const navigate    = useNavigate();

  const { store, loading, error } = useStoreDetail(storeId);
  const { addItem, updateQty, items, storeId: cartStoreId } = useCartStore();
  const [addedId,       setAddedId]       = useState(null);
  const [switchWarning, setSwitchWarning] = useState(null);

  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  const getCartItem = (inv) => items.find(c => c.inventoryId === inv.id);

  const handleAdd = (inv) => {
    if (cartStoreId && cartStoreId !== store.id) {
      setSwitchWarning(inv); return;
    }
    addItem({
      medicineId:   inv.medicine_id,
      medicineName: inv.medicine.name,
      inventoryId:  inv.id,
      storeId:      store.id,
      storeName:    store.name,
      price:        Number(inv.selling_price),
      packSize:     inv.medicine.pack_size,
      availableQty: inv.quantity,   // used by cartStore to cap qty at stock level
    });
    setAddedId(inv.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const confirmSwitch = () => {
    useCartStore.getState().clearCart();
    handleAdd(switchWarning);
    setSwitchWarning(null);
  };

  if (loading) return (
    <div style={{ maxWidth:960, margin:'0 auto', padding:'var(--sp-6) var(--sp-5)' }}>
      <SkeletonCard lines={10} />
    </div>
  );

  if (error || !store) return (
    <div style={{ maxWidth:960, margin:'0 auto', padding:'var(--sp-6) var(--sp-5)', color:'var(--danger)', textAlign:'center' }}>
      {error || 'Store not found'}
    </div>
  );

  // Filter: only show active inventory with stock > 0
  const available = (store.inventory || []).filter(i => i.quantity > 0 && i.status === 'active');

  return (
    <div style={{ maxWidth:960, margin:'0 auto', padding:'var(--sp-6) var(--sp-5)', paddingBottom:'var(--sp-10)' }}>
      <button onClick={() => navigate('/consumer/stores')}
        style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'var(--ink-500)', background:'none', border:'none', cursor:'pointer', marginBottom:'var(--sp-5)', padding:0 }}>
        <ArrowLeft size={15} strokeWidth={2} /> All stores
      </button>

      {/* Store hero */}
      <motion.div style={{ background:'var(--always-dark)', borderRadius:20, padding:'var(--sp-6)', marginBottom:'var(--sp-5)' }}
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ type:'spring', stiffness:280, damping:24 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'var(--sp-4)' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--sp-2)' }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--green-300)', background:'rgba(12,107,78,0.2)', padding:'2px 9px', borderRadius:9999 }}>
                <ShieldCheck size={10} strokeWidth={2.5} style={{ display:'inline', marginRight:3 }} />Verified
              </span>
            </div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(22px,4vw,32px)', fontWeight:600, color:'var(--always-white)', letterSpacing:'-0.5px', marginBottom:'var(--sp-2)' }}>
              {store.name}
            </h1>
            {[
              { icon:MapPin,  val:`${store.address_line}, ${store.city} — ${store.pincode}` },
              { icon:Phone,   val:store.phone },
            ].filter(r => r.val && r.val.trim() !== ', —').map(({ icon:Icon, val }) => (
              <div key={val} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,0.55)', marginTop:4 }}>
                <Icon size={13} strokeWidth={2} style={{ flexShrink:0, color:'rgba(255,255,255,0.4)' }} /> {val}
              </div>
            ))}
          </div>
          {cartCount > 0 && (
            <button onClick={() => navigate('/consumer/cart')}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:'var(--green-700)', color:'var(--always-white)', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              <ShoppingCart size={16} strokeWidth={2} /> Cart ({cartCount})
            </button>
          )}
        </div>
      </motion.div>

      {/* Available medicines */}
      <h2 style={{ fontSize:18, fontWeight:700, color:'var(--ink-900)', marginBottom:'var(--sp-4)' }}>
        Available medicines ({available.length})
      </h2>

      {available.length === 0 && (
        <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)', background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16 }}>
          <ShoppingCart size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)' }} />
          <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:8 }}>No medicines in stock</p>
          <p style={{ fontSize:13 }}>This pharmacy hasn't added any inventory yet. Try another store.</p>
          <button onClick={() => navigate('/consumer/stores')}
            style={{ marginTop:'var(--sp-4)', padding:'10px 20px', background:'var(--green-700)', color:'#FFFFFF', border:'none', borderRadius:'var(--r-md)', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
            Browse other stores
          </button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'var(--sp-3)' }}>
        {available.map((inv, i) => {
          const cartItem = getCartItem(inv);
          const qty      = cartItem?.qty || 0;
          const added    = addedId === inv.id;

          return (
            <motion.div key={inv.id}
              style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:14, padding:'var(--sp-4)', display:'flex', flexDirection:'column', gap:6 }}
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--green-700)' }}>
                {inv.medicine.category}
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)' }}>{inv.medicine.name}</div>
              <div style={{ fontSize:12, color:'var(--ink-500)' }}>{inv.medicine.generic_name} · {inv.medicine.pack_size}</div>
              <Badge variant="otc">OTC</Badge>
              <div style={{ fontSize:12, color:'var(--ink-400)' }}>{inv.quantity} units in stock</div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
                <div>
                  <span style={{ fontSize:17, fontWeight:700, color:'var(--green-700)' }}>₹{Number(inv.selling_price).toFixed(0)}</span>
                  {Number(inv.selling_price) < Number(inv.medicine.mrp) && (
                    <span style={{ fontSize:11, color:'var(--ink-400)', marginLeft:5, textDecoration:'line-through' }}>₹{Number(inv.medicine.mrp).toFixed(0)}</span>
                  )}
                </div>

                {/* Qty counter if in cart, else Add button */}
                {qty > 0 ? (
                  <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--green-50)', border:'1.5px solid var(--green-200)', borderRadius:'var(--r-md)', padding:'3px 6px' }}>
                    <button onClick={() => updateQty(cartItem.inventoryId || cartItem.medicineId, qty - 1)}
                      style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', color:'var(--green-700)', borderRadius:4 }}>
                      <Minus size={13} strokeWidth={2.5} />
                    </button>
                    <span style={{ fontSize:14, fontWeight:700, color:'var(--green-700)', minWidth:16, textAlign:'center' }}>{qty}</span>
                    <button onClick={() => { if (qty < inv.quantity) handleAdd(inv); }}
                      disabled={qty >= inv.quantity}
                      style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--green-700)', border:'none', cursor:'pointer', color:'#FFFFFF', borderRadius:4 }}>
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <motion.button
                    style={{ fontSize:12, fontWeight:700, padding:'6px 13px', borderRadius:'var(--r-md)', border:'none', cursor:'pointer', background: added ? 'var(--success-dark)' : 'var(--green-700)', color:'#FFFFFF', transition:'all 0.15s' }}
                    onClick={() => handleAdd(inv)}
                    whileTap={{ scale:0.93 }}>
                    {added ? '✓ Added' : '+ Add'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Store switch warning */}
      <AnimatePresence>
        {switchWarning && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setSwitchWarning(null)}>
            <motion.div style={{ background:'var(--white)', borderRadius:20, width:'100%', maxWidth:420, padding:'var(--sp-5)', boxShadow:'var(--shadow-lg)' }}
              initial={{ scale:0.93, opacity:0, y:16 }} animate={{ scale:1, opacity:1, y:0 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', marginBottom:'var(--sp-4)' }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'var(--warning-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <AlertTriangle size={20} strokeWidth={1.8} style={{ color:'var(--warning-dark)' }} />
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>Switch store?</div>
                  <div style={{ fontSize:13, color:'var(--ink-500)', marginTop:2 }}>Your cart has items from another pharmacy</div>
                </div>
                <button onClick={() => setSwitchWarning(null)} style={{ marginLeft:'auto', padding:4, color:'var(--ink-400)', display:'flex', borderRadius:6, background:'none', border:'none', cursor:'pointer' }}>
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
              <p style={{ fontSize:14, color:'var(--ink-600)', lineHeight:1.6, marginBottom:'var(--sp-5)' }}>
                Switching to <strong>{store.name}</strong> will clear your current cart.
              </p>
              <div style={{ display:'flex', gap:'var(--sp-3)' }}>
                <button onClick={() => setSwitchWarning(null)}
                  style={{ flex:1, padding:10, background:'var(--white)', color:'var(--ink-700)', border:'1px solid var(--ink-200)', borderRadius:'var(--r-md)', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  Keep cart
                </button>
                <button onClick={confirmSwitch}
                  style={{ flex:1, padding:10, background:'var(--green-700)', color:'#FFFFFF', border:'none', borderRadius:'var(--r-md)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  Switch store
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
