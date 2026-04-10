import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, CreditCard, Smartphone, Banknote,
  CheckCircle, ArrowLeft, ArrowRight, ShieldCheck, Plus, Info, X, Check
} from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useOrderStore from '../../store/orderStore';
import useToastStore from '../../store/toastStore';
import usePageTitle from '../../utils/usePageTitle';
import { api } from '../../utils/api';
import { useAddresses } from '../../hooks/useAddresses';
import styles from './Checkout.module.css';

const paymentMethods = [
  { id: 'upi',  icon: Smartphone, label: 'UPI',                    sub: 'Pay via any UPI app' },
  { id: 'card', icon: CreditCard,  label: 'Debit / Credit Card',   sub: 'Visa, Mastercard, RuPay' },
  { id: 'cod',  icon: Banknote,    label: 'Cash on Delivery',      sub: 'Pay when you receive' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, storeName, storeId, clearCart } = useCartStore();
  const { addOrder }  = useOrderStore();
  const toast         = useToastStore();
  const { addresses, loading: addrLoading, add: addAddress } = useAddresses();
  usePageTitle('Checkout');

  const [step,         setStep]         = useState(1);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [payment,      setPayment]      = useState('upi');
  const [upiId,        setUpiId]        = useState('');
  const [cardNumber,   setCardNumber]   = useState('');
  const [cardExpiry,   setCardExpiry]   = useState('');
  const [cardCvv,      setCardCvv]      = useState('');
  const [loading,      setLoading]      = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const [countdown,    setCountdown]    = useState(5);
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [addrForm, setAddrForm]         = useState({ label:'', address_line:'', city:'', pincode:'' });

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddr) {
      const def = addresses.find(a => a.is_default) || addresses[0];
      setSelectedAddr(def.id);
    }
  }, [addresses, selectedAddr]);

  // Countdown redirect after order placed
  useEffect(() => {
    if (step !== 3 || !placedOrderId) return;
    const interval = setInterval(() => setCountdown(c => c - 1), 1000);
    const timeout  = setTimeout(() => navigate(`/consumer/orders/${placedOrderId}`), 5000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step, placedOrderId, navigate]);

  const subtotal    = items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = deliveryType === 'pickup' ? 0 : (subtotal >= 200 ? 0 : 30);
  const gst         = Math.round(subtotal * 0.12);
  const total       = subtotal + deliveryFee + gst;

  const handlePlaceOrder = async () => {
    if (payment === 'upi') {
      if (!upiId.trim()) { toast.error('Please enter your UPI ID.'); return; }
      if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiId.trim())) { toast.error('Invalid UPI ID format (e.g. name@upi).'); return; }
    }
    if (payment === 'card') {
      if (!cardNumber.replace(/\s/g,'').match(/^\d{16}$/)) { toast.error('Enter a valid 16-digit card number.'); return; }
      if (!cardExpiry.match(/^\d{2}\s*\/\s*\d{2}$/)) { toast.error('Enter card expiry as MM / YY.'); return; }
      if (!cardCvv.match(/^\d{3}$/)) { toast.error('Enter a valid 3-digit CVV.'); return; }
    }
    if (total > 2000 && payment === 'cod') {
      toast.error('COD is not available for orders above ₹2,000. Please choose UPI or Card.'); return;
    }

    // Validate items have real inventoryId (set when adding from StoreProfile)
    const invalidItems = items.filter(i => !i.inventoryId || i.storeId === 'direct');
    if (invalidItems.length > 0 || !storeId || storeId === 'direct') {
      // Navigate to stores with a helpful state message instead of blocking error
      navigate('/consumer/stores', { state: { message: 'Please choose a pharmacy and add medicines from its store page to place an order.' } });
      return;
    }

    setLoading(true);
    try {
      const addr = addresses.find(a => a.id === selectedAddr);
      const res = await api.post('/orders', {
        store_id:         storeId,
        delivery_type:    deliveryType,
        payment_method:   payment,
        delivery_address: addr ? `${addr.address_line}, ${addr.city} — ${addr.pincode}` : '',
        items: items.map(i => ({
          inventory_id: i.inventoryId,
          quantity:     i.qty,
        })),
      });
      addOrder(res.data);
      clearCart();
      setPlacedOrderId(res.data.id);
      setStep(3);
    } catch (err) {
      toast.error(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!addrForm.label || !addrForm.address_line || !addrForm.city || !addrForm.pincode) {
      toast.error('Please fill all address fields.'); return;
    }
    try {
      await addAddress(addrForm);
      setShowAddrModal(false);
      setAddrForm({ label:'', address_line:'', city:'', pincode:'' });
      toast.success('Address added.');
    } catch (err) { toast.error(err.message); }
  };

  // ── Order confirmed screen ───────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className={styles.confirmPage}>
        <motion.div className={styles.confirmCard}
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
          <motion.div className={styles.confirmIcon}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}>
            <CheckCircle size={40} strokeWidth={1.5} />
          </motion.div>
          <h1 className={styles.confirmTitle}>Order Placed!</h1>
          <p className={styles.confirmSub}>
            Your order has been sent to <strong>{storeName || 'the pharmacy'}</strong>.
            You'll receive a confirmation once they accept it.
          </p>
          <div className={styles.confirmOrderId}>
            <span className={styles.orderLabel}>Order ID</span>
            <span className={styles.orderValue}>{placedOrderId?.slice(0,8)}…</span>
          </div>
          <p style={{ fontSize:13, color:'var(--ink-400)', marginBottom:'var(--sp-4)' }}>
            Redirecting to order tracking in {countdown}s…
          </p>
          <div className={styles.confirmActions}>
            <button className={styles.trackBtn} onClick={() => navigate(`/consumer/orders/${placedOrderId}`)}>
              Track Order <ArrowRight size={16} strokeWidth={2} />
            </button>
            <button className={styles.homeBtn} onClick={() => navigate('/consumer/home')}>
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button className={styles.backBtn} onClick={() => step === 1 ? navigate('/consumer/cart') : setStep(1)}>
          <ArrowLeft size={15} strokeWidth={2} /> {step === 1 ? 'Back to Cart' : 'Back to Address'}
        </button>

        {/* Progress */}
        <div className={styles.progress}>
          {['Delivery Details', 'Payment', 'Confirm'].map((s, i) => (
            <div key={s} className={styles.progStep}>
              <div className={`${styles.progDot} ${step > i+1 ? styles.progDone : step === i+1 ? styles.progActive : ''}`}>
                {step > i+1 ? <CheckCircle size={14} strokeWidth={2.5} /> : i+1}
              </div>
              <span className={styles.progLabel}>{s}</span>
              {i < 2 && <div className={`${styles.progLine} ${step > i+1 ? styles.progLineDone : ''}`} />}
            </div>
          ))}
        </div>

        <div className={styles.layout}>
          <div className={styles.formCol}>
            <AnimatePresence mode="wait">

              {/* Step 1 — Delivery */}
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:-16 }} transition={{ duration:0.2 }}>

                  <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Delivery type</h2>
                    <div className={styles.deliveryTypes}>
                      {[
                        { id:'delivery', label:'Home Delivery', sub:'Delivered to your address' },
                        { id:'pickup',   label:'Store Pickup',  sub:'Collect from store (free)' },
                      ].map(dt => (
                        <button key={dt.id}
                          className={`${styles.dtCard} ${deliveryType === dt.id ? styles.dtCardActive : ''}`}
                          onClick={() => setDeliveryType(dt.id)}>
                          <div className={styles.dtLabel}>{dt.label}</div>
                          <div className={styles.dtSub}>{dt.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {deliveryType === 'delivery' && (
                    <div className={styles.section}>
                      <h2 className={styles.sectionTitle}>Delivery address</h2>
                      {addrLoading ? (
                        <p style={{ fontSize:14, color:'var(--ink-400)' }}>Loading addresses…</p>
                      ) : (
                        <div className={styles.addressList}>
                          {addresses.map(addr => (
                            <button key={addr.id}
                              className={`${styles.addrCard} ${selectedAddr === addr.id ? styles.addrCardActive : ''}`}
                              onClick={() => setSelectedAddr(addr.id)}>
                              <div className={styles.addrRadio}>
                                {selectedAddr === addr.id && <div className={styles.addrRadioDot} />}
                              </div>
                              <div>
                                <div className={styles.addrLabel}>{addr.label}</div>
                                <div className={styles.addrText}>{addr.address_line}, {addr.city} — {addr.pincode}</div>
                              </div>
                              {addr.is_default && <span className={styles.defaultTag}>Default</span>}
                            </button>
                          ))}
                          <button className={styles.addAddrBtn} onClick={() => setShowAddrModal(true)}>
                            <Plus size={14} strokeWidth={2.5} /> Add new address
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button className={styles.nextBtn} onClick={() => setStep(2)}>
                    Continue to Payment <ArrowRight size={16} strokeWidth={2} />
                  </button>
                </motion.div>
              )}

              {/* Step 2 — Payment */}
              {step === 2 && (
                <motion.div key="step2"
                  initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:-16 }} transition={{ duration:0.2 }}>

                  <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Payment method</h2>
                    <div className={styles.paymentList}>
                      {paymentMethods.map(pm => (
                        <button key={pm.id}
                          className={`${styles.pmCard} ${payment === pm.id ? styles.pmCardActive : ''}`}
                          onClick={() => setPayment(pm.id)}>
                          <div className={`${styles.pmIcon} ${payment === pm.id ? styles.pmIconActive : ''}`}>
                            <pm.icon size={18} strokeWidth={1.8} />
                          </div>
                          <div className={styles.pmInfo}>
                            <div className={styles.pmLabel}>{pm.label}</div>
                            <div className={styles.pmSub}>{pm.sub}</div>
                          </div>
                          <div className={`${styles.pmRadio} ${payment === pm.id ? styles.pmRadioActive : ''}`}>
                            {payment === pm.id && <div className={styles.pmRadioDot} />}
                          </div>
                        </button>
                      ))}
                    </div>

                    <AnimatePresence>
                      {payment === 'upi' && (
                        <motion.div className={styles.upiInput}
                          initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                          <label className={styles.inputLabel}>UPI ID</label>
                          <input className={styles.input} placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)} />
                        </motion.div>
                      )}
                      {payment === 'card' && (
                        <motion.div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)', marginTop:'var(--sp-3)' }}
                          initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                          <div>
                            <label className={styles.inputLabel}>Card Number</label>
                            <input className={styles.input} placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(e.target.value)} maxLength={19} />
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-3)' }}>
                            <div>
                              <label className={styles.inputLabel}>Expiry</label>
                              <input className={styles.input} placeholder="MM / YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} maxLength={7} />
                            </div>
                            <div>
                              <label className={styles.inputLabel}>CVV</label>
                              <input className={styles.input} placeholder="•••" type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value)} maxLength={3} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                      {payment === 'cod' && (
                        <motion.div style={{ display:'flex', alignItems:'flex-start', gap:'var(--sp-2)', background:'var(--warning-light)', border:'1px solid #FDE68A', borderRadius:'var(--r-md)', padding:'var(--sp-3) var(--sp-4)', marginTop:'var(--sp-3)', fontSize:13, color:'#92400E', lineHeight:1.5 }}
                          initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                          <Info size={14} strokeWidth={2} style={{ flexShrink:0, marginTop:1 }} />
                          <span>Please keep exact change ready. COD orders above ₹2,000 are not accepted. A delivery fee of ₹30 applies for orders below ₹200.</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button className={styles.nextBtn} onClick={handlePlaceOrder} disabled={loading}>
                    {loading
                      ? <span className={styles.spinner} />
                      : <><ShieldCheck size={16} strokeWidth={2} /> Place Order — ₹{total}</>}
                  </button>
                  <p className={styles.secureNote}>Your payment is encrypted and secure. GST invoice will be emailed on confirmation.</p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Order summary sidebar */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryTitle}>Order from {storeName || 'Pharmacy'}</div>
            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item._key || item.medicineId} className={styles.summaryItem}>
                  <span>{item.medicineName} × {item.qty}</span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
            <div className={styles.summaryBreak}>
              {[
                { label:'Subtotal',  val:`₹${subtotal}` },
                { label:'Delivery',  val: deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`, green: deliveryFee === 0 },
                { label:'GST (12%)', val:`₹${gst}` },
              ].map(({ label, val, green }) => (
                <div key={label} className={styles.breakLine}>
                  <span>{label}</span>
                  <span style={{ color: green ? 'var(--success)' : undefined, fontWeight: green ? 700 : undefined }}>{val}</span>
                </div>
              ))}
            </div>
            <div className={styles.totalRow}><span>Total</span><span>₹{total}</span></div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddrModal && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setShowAddrModal(false)}>
            <motion.div style={{ background:'#FFFFFF', borderRadius:20, width:'100%', maxWidth:440, boxShadow:'var(--shadow-lg)', overflow:'hidden' }}
              initial={{ scale:0.93, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--sp-4) var(--sp-5)', borderBottom:'1px solid #E5E7EB' }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--ink-900)' }}>Add New Address</h3>
                <button onClick={() => setShowAddrModal(false)} style={{ display:'flex', padding:4, color:'var(--ink-400)', borderRadius:6 }}><X size={18} /></button>
              </div>
              <div style={{ padding:'var(--sp-5)', display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
                {[
                  { label:'Label (e.g. Home, Work)', key:'label',       placeholder:'Home' },
                  { label:'Full Address',             key:'address_line', placeholder:'Street, Landmark' },
                  { label:'City',                     key:'city',        placeholder:'Sonipat' },
                  { label:'PIN Code',                 key:'pincode',     placeholder:'131001' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>{label}</label>
                    <input value={addrForm[key]} onChange={e => setAddrForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', outline:'none', color:'var(--ink-900)', boxSizing:'border-box' }}
                      onFocus={e => e.target.style.borderColor='var(--green-700)'}
                      onBlur={e => e.target.style.borderColor='#E5E7EB'} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'var(--sp-3)', padding:'var(--sp-4) var(--sp-5)', borderTop:'1px solid #E5E7EB' }}>
                <button onClick={() => setShowAddrModal(false)} style={{ flex:1, padding:10, background:'#FFFFFF', color:'var(--ink-700)', border:'1px solid #E5E7EB', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>Cancel</button>
                <button onClick={handleAddAddress} style={{ flex:1, padding:10, background:'var(--green-700)', color:'#FFFFFF', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Check size={15} strokeWidth={2.5} /> Add Address
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
