import usePageTitle from '../../utils/usePageTitle';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, ShoppingCart, MapPin, AlertTriangle, Check } from 'lucide-react';
import { api } from '../../utils/api';
import useCartStore from '../../store/cartStore';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import styles from './MedicineDetail.module.css';

export default function MedicineDetail() {
  usePageTitle('Medicine Detail');
  const { medicineId } = useParams();
  const navigate = useNavigate();

  const [med, setMed]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [addedStoreId, setAddedStoreId] = useState(null);
  const [storeWarning, setStoreWarning] = useState(false);

  const { addItem, items, storeId: cartStoreId } = useCartStore();

  useEffect(() => {
    api.get(`/medicines/${medicineId}`)
      .then(res => { setMed(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [medicineId]);

  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  const handleAddToCart = () => {
    if (!med) return;
    if (cartStoreId && cartStoreId !== 'direct') {
      setStoreWarning(true);
      return;
    }
    addItem({
      medicineId:   med.id,
      medicineName: med.name,
      inventoryId:  null,
      storeId:      'direct',
      storeName:    'Direct',
      price:        Number(med.mrp),
      packSize:     med.pack_size,
    });
    setAddedStoreId(med.id);
    setTimeout(() => setAddedStoreId(null), 2000);
  };

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.inner}><SkeletonCard lines={8} /></div>
    </div>
  );

  if (error || !med) return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={2} /> Back
        </button>
        <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--danger)' }}>
          {error || 'Medicine not found'}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={2} /> Back to medicines
        </button>

        <div className={styles.layout}>
          {/* Left col — medicine info */}
          <div className={styles.leftCol}>
            <motion.div className={styles.heroCard}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ type:'spring', stiffness:280, damping:24 }}>

              <div className={styles.heroTags}>
                <span className={styles.catTag}>{med.category}</span>
                <Badge variant="otc">OTC</Badge>
              </div>

              <h1 className={styles.medName}>{med.name}</h1>
              <p className={styles.medSalt}>{med.salt_composition}</p>

              <div className={styles.metaRow}>
                <span>{med.manufacturer}</span>
                <span className={styles.dot}>·</span>
                <span>{med.form}</span>
                <span className={styles.dot}>·</span>
                <span>{med.pack_size}</span>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Generic Name</span>
                  <span className={styles.infoValue}>{med.generic_name}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Schedule</span>
                  <span className={styles.infoValue}>{med.schedule?.toUpperCase() || 'OTC'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>MRP</span>
                  <span className={styles.infoValue}>₹{Number(med.mrp).toFixed(0)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Form</span>
                  <span className={styles.infoValue}>{med.form}</span>
                </div>
              </div>

              <div className={styles.dpcoChip}>
                <ShieldCheck size={12} strokeWidth={2.5} />
                CDSCO Approved · DPCO Compliant · Price controlled
              </div>
            </motion.div>
          </div>

          {/* Right col — add to cart */}
          <div className={styles.rightCol}>
            <motion.div className={styles.priceCard}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.1, type:'spring', stiffness:280, damping:24 }}>

              <h2 className={styles.priceCardTitle}>
                <MapPin size={15} strokeWidth={2} />
                Add to cart
              </h2>

              <div className={styles.selectedSummary}>
                <div className={styles.selectedLeft}>
                  <span className={styles.selectedLabel}>MRP</span>
                  <span className={styles.selectedStore}>{med.name}</span>
                </div>
                <div className={styles.selectedRight}>
                  <span className={styles.selectedPrice}>₹{Number(med.mrp).toFixed(0)}</span>
                  <span className={styles.selectedPack}>{med.pack_size}</span>
                </div>
              </div>

              <p style={{ fontSize:12, color:'var(--ink-400)', lineHeight:1.6, marginBottom:'var(--sp-4)' }}>
                Browse a verified store near you to see real-time prices and stock availability.
              </p>

              <AnimatePresence>
                {storeWarning && (
                  <motion.div className={styles.storeWarning}
                    initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                    exit={{ opacity:0, height:0 }}>
                    <AlertTriangle size={14} strokeWidth={2} />
                    <div>
                      <strong>Your cart has items from a different store.</strong> Adding this will clear your cart.
                      <div className={styles.warningActions}>
                        <button className={styles.warnSwitch} onClick={() => {
                          useCartStore.getState().clearCart();
                          setStoreWarning(false);
                          addItem({ medicineId: med.id, medicineName: med.name, inventoryId: null, storeId:'direct', storeName:'Direct', price: Number(med.mrp), packSize: med.pack_size });
                          setAddedStoreId(med.id);
                          setTimeout(() => setAddedStoreId(null), 2000);
                        }}>Clear cart & add</button>
                        <button className={styles.warnCancel} onClick={() => setStoreWarning(false)}>Cancel</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                className={`${styles.addToCart} ${addedStoreId ? styles.addedToCart : ''}`}
                onClick={handleAddToCart}
                disabled={!!storeWarning}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
                {addedStoreId
                  ? <><Check size={18} strokeWidth={2.5} /> Added to cart!</>
                  : <><ShoppingCart size={18} strokeWidth={2} /> Add to Cart</>}
              </motion.button>

              <button className={styles.viewCartBtn}
                onClick={() => navigate('/consumer/stores')}
                style={{ marginTop:'var(--sp-3)', width:'100%', padding:'10px', background:'var(--green-50)', color:'var(--green-700)', border:'1.5px solid var(--green-200)', borderRadius:'var(--r-md)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                Browse stores with stock →
              </button>

              {cartCount > 0 && (
                <button className={styles.viewCartBtn} onClick={() => navigate('/consumer/cart')}>
                  View cart ({cartCount} item{cartCount > 1 ? 's' : ''}) →
                </button>
              )}

              <p className={styles.dpcoNote}>
                All prices at or below government MRP · DPCO compliant
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
