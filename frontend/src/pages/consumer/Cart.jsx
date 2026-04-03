import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, Store, ArrowRight, ShieldCheck } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import styles from './Cart.module.css';

export default function Cart() {
  usePageTitle('Your Cart');

  const navigate = useNavigate();
  const { items, storeName, updateQty, removeItem, clearCart } = useCartStore();
  const [removeTarget, setRemoveTarget] = useState(null);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = subtotal > 0 ? (subtotal >= 200 ? 0 : 30) : 0;
  const gst = Math.round(subtotal * 0.12);
  const total = subtotal + deliveryFee + gst;

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className={styles.emptyCard}
        >
          <div className={styles.emptyIcon}><ShoppingCart size={36} strokeWidth={1.2} /></div>
          <h2>Your cart is empty</h2>
          <p>Browse medicines from verified stores near you and add them to your cart.</p>
          <button className={styles.browseBtn} onClick={() => navigate('/consumer/medicines')}>
            Browse Medicines <ArrowRight size={16} strokeWidth={2} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Cart</h1>
          <button className={styles.clearBtn} onClick={clearCart}>Clear all</button>
        </div>

        <div className={styles.layout}>
          {/* Items */}
          <div className={styles.itemsCol}>
            {/* Store badge */}
            <div className={styles.storeBadge}>
              <Store size={14} strokeWidth={2} />
              <span>Ordering from <strong>{storeName || 'Browse'}</strong></span>
              {storeName && storeName !== 'Direct' && (
                <div className={styles.verifiedPill}>
                  <ShieldCheck size={10} strokeWidth={2.5} /> Verified
                </div>
              )}
            </div>

            {/* Warning if items added from browse instead of store */}
            {items.some(i => !i.inventoryId || i.storeId === 'direct') && (
              <div style={{ background:'var(--warning-light)', border:'1px solid #FDE68A', borderRadius:10, padding:'var(--sp-3) var(--sp-4)', fontSize:13, color:'#92400E', marginBottom:'var(--sp-3)', display:'flex', gap:8, alignItems:'flex-start' }}>
                <span style={{ fontSize:16, flexShrink:0 }}>⚠</span>
                <span>
                  These medicines were added from the browse page without selecting a store.
                  To place an order, go to <strong>Stores</strong>, pick a pharmacy, and add medicines from there.
                </span>
              </div>
            )}

            {/* Item list */}
            <div className={styles.itemList}>
              <AnimatePresence>
                {items.map((item, i) => (
                  <motion.div
                    key={item._key || item.medicineId}
                    className={styles.item}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className={styles.itemLeft}>
                      <div className={styles.itemInitial}>
                        {item.medicineName.charAt(0)}
                      </div>
                      <div>
                        <div className={styles.itemName}>{item.medicineName}</div>
                        <div className={styles.itemPack}>{item.packSize}</div>
                        <div className={styles.itemPrice}>₹{item.price} per pack</div>
                      </div>
                    </div>
                    <div className={styles.itemRight}>
                      <div className={styles.qtyControl}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQty(item._key || item.medicineId, item.qty - 1)}
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className={styles.qtyValue}>{item.qty}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQty(item._key || item.medicineId, item.qty + 1)}
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                      <div className={styles.itemTotal}>₹{item.price * item.qty}</div>
                      <button
                        className={styles.removeBtn}
                        onClick={() => setRemoveTarget(item._key || item.medicineId)}
                      >
                        <Trash2 size={14} strokeWidth={1.8} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button
              className={styles.addMoreBtn}
              onClick={() => navigate('/consumer/medicines')}
            >
              + Add more medicines
            </button>
          </div>

          {/* Summary */}
          <motion.div
            className={styles.summaryCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 24 }}
          >
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryLines}>
              <div className={styles.summaryLine}>
                <span>Subtotal ({items.length} item{items.length > 1 ? 's' : ''})</span>
                <span>₹{subtotal}</span>
              </div>
              <div className={styles.summaryLine}>
                <span>Delivery fee</span>
                <span className={deliveryFee === 0 ? styles.free : ''}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              {deliveryFee > 0 && (
                <div className={styles.freeNote}>Add ₹{200 - subtotal} more for free delivery</div>
              )}
              <div className={styles.summaryLine}>
                <span>GST (12%)</span>
                <span>₹{gst}</span>
              </div>
            </div>

            <div className={styles.totalLine}>
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <motion.button
              className={styles.checkoutBtn}
              onClick={() => navigate('/consumer/checkout')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Proceed to Checkout
              <ArrowRight size={17} strokeWidth={2.5} />
            </motion.button>

            <div className={styles.trustRow}>
              <ShieldCheck size={13} strokeWidth={2.5} style={{ color: 'var(--green-700)', flexShrink: 0 }} />
              <span>All medicines from verified, CDSCO-licensed stores</span>
            </div>
            <div className={styles.trustRow}>
              <ShieldCheck size={13} strokeWidth={2.5} style={{ color: 'var(--green-700)', flexShrink: 0 }} />
              <span>GST invoice auto-generated on order confirmation</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>

      {/* Remove confirm modal */}
      <AnimatePresence>
        {removeTarget && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setRemoveTarget(null)}>
            <motion.div style={{ background:'var(--white)', borderRadius:20, width:'100%', maxWidth:380, padding:'var(--sp-5)', boxShadow:'var(--shadow-lg)' }}
              initial={{ scale:0.93, y:16, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)', marginBottom:8 }}>Remove item?</div>
              <p style={{ fontSize:14, color:'var(--ink-500)', marginBottom:'var(--sp-5)', lineHeight:1.5 }}>
                {items.find(i => (i._key || i.medicineId) === removeTarget)?.medicineName} will be removed from your cart.
              </p>
              <div style={{ display:'flex', gap:'var(--sp-3)' }}>
                <button onClick={() => setRemoveTarget(null)}
                  style={{ flex:1, padding:10, background:'var(--white)', color:'var(--ink-700)', border:'1px solid var(--ink-200)', borderRadius:'var(--r-md)', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  Keep
                </button>
                <button onClick={() => { removeItem(removeTarget); setRemoveTarget(null); }}
                  style={{ flex:1, padding:10, background:'var(--danger)', color:'#FFFFFF', border:'none', borderRadius:'var(--r-md)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}