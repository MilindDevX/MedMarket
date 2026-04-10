import usePageTitle from '../../utils/usePageTitle';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ShieldCheck, Star, Map } from 'lucide-react';
import { useStores } from '../../hooks/useStores';
import styles from './ConsumerStores.module.css';

export default function ConsumerStores() {
  usePageTitle('Nearby Stores');
  const navigate        = useNavigate();
  const location        = useLocation();
  const [searchParams]  = useSearchParams();
  const medicineFilter  = searchParams.get('medicine') || '';
  const stateMessage    = location.state?.message || '';
  const { stores, loading, error } = useStores();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Stores near you</h1>
        <p className={styles.subtitle}>Showing verified pharmacies — click to see available stock</p>
      </div>

      {/* Redirect message (e.g. from Checkout) */}
      {stateMessage && (
        <div style={{ background:'var(--warning-light)', border:'1px solid #FDE68A', borderRadius:10, padding:'var(--sp-3) var(--sp-4)', fontSize:13, color:'#92400E', marginBottom:'var(--sp-4)', display:'flex', gap:8, alignItems:'flex-start' }}>
          <span>⚠</span><span>{stateMessage}</span>
        </div>
      )}

      {/* Medicine filter banner */}
      {medicineFilter && (
        <div style={{ background:'var(--green-50)', border:'1px solid var(--green-200)', borderRadius:10, padding:'var(--sp-3) var(--sp-4)', fontSize:13, color:'var(--green-700)', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>Showing stores that may carry <strong>{medicineFilter}</strong> — select a store to check stock.</span>
          <button onClick={() => navigate('/consumer/stores')} style={{ fontSize:12, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', flexShrink:0, marginLeft:8 }}>✕ Clear</button>
        </div>
      )}

      {/* Map placeholder */}
      <div className={styles.mapBox} role="img" aria-label="Map placeholder showing store locations">
        <div className={styles.mapGrid} />
        <div className={styles.mapContent}>
          <div className={styles.mapIcon}>
            <Map size={22} strokeWidth={1.5} style={{ color:'var(--green-700)' }} />
          </div>
          <div className={styles.mapText}>Interactive map</div>
          <div className={styles.mapSub}>Google Maps integration — configure VITE_GOOGLE_MAPS_KEY to enable</div>
        </div>
      </div>

      {loading && (
        <div className={styles.sectionTitle}>Loading stores...</div>
      )}

      {error && (
        <div style={{ padding:'var(--sp-5)', color:'var(--danger)', textAlign:'center' }}>
          Failed to load stores. Please try again.
        </div>
      )}

      {!loading && !error && (
        <>
          <div className={styles.sectionTitle}>
            <ShieldCheck size={18} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
            {stores.length} verified pharmacies
          </div>

          <div className={styles.grid}>
            {stores.map((store, i) => (
              <motion.div
                key={store.id}
                className={styles.storeCard}
                initial={{ opacity:0, y:16 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.08 }}
                onClick={() => navigate(`/consumer/stores/${store.id}`)}
                role="button"
                aria-label={`View ${store.name}`}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/consumer/stores/${store.id}`)}
              >
                <div className={styles.storeCardTop}>
                  <div className={styles.storeAvatar}>{store.name.charAt(0)}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className={styles.storeName}>{store.name}</div>
                    <div className={styles.storeAddress}>{store.address_line}, {store.city}</div>
                  </div>
                </div>
                <div className={styles.storeMeta}>
                  <span className={styles.verifiedChip}>
                    <ShieldCheck size={10} strokeWidth={2.5} /> Verified
                  </span>
                  <span className={styles.ratingChip}>
                    <Star size={11} strokeWidth={2} style={{ color:'#F59E0B', fill:'#F59E0B' }} />
                    {Number(store.avg_rating).toFixed(1)} ({store.total_reviews})
                  </span>
                  <span className={styles.distanceChip}>📍 {store.city}</span>
                </div>
              </motion.div>
            ))}

            {stores.length === 0 && (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)' }}>
                No stores found in your area.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
