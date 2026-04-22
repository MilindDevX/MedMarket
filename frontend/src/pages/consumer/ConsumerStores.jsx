import usePageTitle from '../../utils/usePageTitle';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ShieldCheck, Star, LocateFixed, Loader, Search, X } from 'lucide-react';
import { useStores } from '../../hooks/useStores';
import useLocationStore from '../../store/locationStore';
import styles from './ConsumerStores.module.css';

export default function ConsumerStores() {
  usePageTitle('Nearby Stores');
  const navigate       = useNavigate();
  const location       = useLocation();
  const [searchParams] = useSearchParams();

  const medicineFilter = searchParams.get('medicine') || '';
  const stateMessage   = location.state?.message || '';

  // Read from the shared locationStore — same source as home tab and navbar
  const { city: storeCity, detecting, error: locationError, setCity, detectLocation, clear } = useLocationStore();

  // Local input mirrors the store city; changes only commit on form submit
  const [cityInput, setCityInput] = useState(storeCity);
  useEffect(() => { setCityInput(storeCity); }, [storeCity]);

  const { stores, loading, error } = useStores(storeCity);

  const applyCity = (e) => {
    e.preventDefault();
    const trimmed = cityInput.trim();
    if (trimmed) setCity(trimmed);
  };

  const clearCity = () => {
    clear();
    setCityInput('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {storeCity ? `Pharmacies in ${storeCity}` : 'Stores near you'}
        </h1>
        <p className={styles.subtitle}>
          {storeCity
            ? `${stores.length} verified pharmacy${stores.length !== 1 ? 's' : ''} found`
            : 'Enter your city to find verified pharmacies near you'}
        </p>
      </div>

      {/* Location controls */}
      <div style={{ display:'flex', gap:8, marginBottom:'var(--sp-4)', flexWrap:'wrap' }}>
        <form onSubmit={applyCity} style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:220 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, background:'var(--white)', border:'1.5px solid var(--ink-200)', borderRadius:'var(--r-md)', padding:'0 14px', height:42 }}>
            <MapPin size={15} strokeWidth={2.5} style={{ color:'var(--green-700)', flexShrink:0 }} />
            <input
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              placeholder="Enter your city, e.g. Pune"
              style={{ flex:1, border:'none', outline:'none', fontSize:14, fontFamily:'var(--font-body)', background:'transparent', color:'var(--ink-900)', minWidth:0 }}
            />
            {cityInput && (
              <button type="button" onClick={clearCity}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-400)', display:'flex', padding:2, flexShrink:0 }}>
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
          <button type="submit"
            style={{ height:42, padding:'0 18px', background:'var(--green-700)', color:'#FFF', border:'none', borderRadius:'var(--r-md)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <Search size={14} strokeWidth={2.5} /> Search
          </button>
        </form>

        <button onClick={detectLocation} disabled={detecting}
          style={{ height:42, padding:'0 16px', background:'var(--white)', color:'var(--green-700)', border:'1.5px solid var(--green-200)', borderRadius:'var(--r-md)', fontSize:13, fontWeight:700, cursor: detecting ? 'not-allowed' : 'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6, opacity: detecting ? 0.7 : 1, flexShrink:0 }}>
          {detecting
            ? <><Loader size={13} strokeWidth={2.5} style={{ animation:'spin 0.8s linear infinite' }} /> Detecting…</>
            : <><LocateFixed size={13} strokeWidth={2.5} /> Use my location</>}
        </button>
      </div>

      {locationError && (
        <div style={{ background:'var(--warning-light)', border:'1px solid #FDE68A', borderRadius:8, padding:'8px 14px', fontSize:13, color:'var(--warning-dark)', marginBottom:'var(--sp-3)' }}>
          {locationError}
        </div>
      )}

      {stateMessage && (
        <div style={{ background:'var(--warning-light)', border:'1px solid #FDE68A', borderRadius:10, padding:'var(--sp-3) var(--sp-4)', fontSize:13, color:'#92400E', marginBottom:'var(--sp-4)', display:'flex', gap:8, alignItems:'flex-start' }}>
          <span>⚠</span><span>{stateMessage}</span>
        </div>
      )}

      {medicineFilter && (
        <div style={{ background:'var(--green-50)', border:'1px solid var(--green-200)', borderRadius:10, padding:'var(--sp-3) var(--sp-4)', fontSize:13, color:'var(--green-700)', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>Showing stores that may carry <strong>{medicineFilter}</strong></span>
          <button onClick={() => navigate('/consumer/stores')} style={{ fontSize:12, color:'var(--ink-400)', background:'none', border:'none', cursor:'pointer', flexShrink:0, marginLeft:8 }}>✕ Clear</button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:'var(--sp-8)', color:'var(--ink-400)', fontSize:14 }}>Loading stores…</div>
      )}

      {error && (
        <div style={{ padding:'var(--sp-5)', color:'var(--danger)', textAlign:'center' }}>Failed to load stores. Please try again.</div>
      )}

      {!loading && !error && (
        <>
          {!storeCity ? (
            <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)', background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16 }}>
              <MapPin size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)', display:'block' }} />
              <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:6 }}>Enter your city or tap "Use my location"</p>
              <p style={{ fontSize:13 }}>We'll show verified pharmacies in your area.</p>
            </div>
          ) : stores.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)', background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16 }}>
              <MapPin size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)', display:'block' }} />
              <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:6 }}>No stores found in {storeCity}</p>
              <p style={{ fontSize:13 }}>Try a nearby city or check your spelling.</p>
            </div>
          ) : (
            <>
              <div className={styles.sectionTitle}>
                <ShieldCheck size={18} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
                {stores.length} verified {stores.length === 1 ? 'pharmacy' : 'pharmacies'} in {storeCity}
              </div>

              <div className={styles.grid}>
                {stores.map((store, i) => (
                  <motion.div key={store.id} className={styles.storeCard}
                    initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                    onClick={() => navigate(`/consumer/stores/${store.id}`)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/consumer/stores/${store.id}`)}>
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
                        {Number(store.avg_rating || 0).toFixed(1)} ({store.total_reviews || 0})
                      </span>
                      <span className={styles.distanceChip}>📍 {store.city}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
