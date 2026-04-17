import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ShieldCheck, Star, Map, Search, X } from 'lucide-react';
import { useStores } from '../../hooks/useStores';
import styles from './ConsumerStores.module.css';

const CITY_KEY = 'medmarket_city';

function getSavedCity() {
  try { return sessionStorage.getItem(CITY_KEY) || ''; } catch { return ''; }
}

export default function ConsumerStores() {
  usePageTitle('Nearby Stores');
  const navigate       = useNavigate();
  const location       = useLocation();
  const [searchParams] = useSearchParams();

  const medicineFilter = searchParams.get('medicine') || '';
  const stateMessage   = location.state?.message || '';

  const [cityInput,  setCityInput]  = useState(getSavedCity);
  const [activeCity, setActiveCity] = useState(getSavedCity);

  const { stores, loading, error } = useStores(activeCity);

  const applyCity = (e) => {
    e.preventDefault();
    const city = cityInput.trim();
    setActiveCity(city);
    try { sessionStorage.setItem(CITY_KEY, city); } catch {}
  };

  const clearCity = () => {
    setCityInput('');
    setActiveCity('');
    try { sessionStorage.removeItem(CITY_KEY); } catch {}
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {activeCity ? `Pharmacies in ${activeCity}` : 'Stores near you'}
        </h1>
        <p className={styles.subtitle}>
          {activeCity
            ? `${stores.length} verified pharmacy${stores.length !== 1 ? 's' : ''} found`
            : 'Enter your city to find verified pharmacies near you'}
        </p>
      </div>

      {/* City search bar */}
      <form onSubmit={applyCity} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--sp-4)' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, background:'var(--white)', border:'1.5px solid var(--ink-200)', borderRadius:'var(--r-md)', padding:'0 14px', height:42 }}>
          <MapPin size={15} strokeWidth={2.5} style={{ color:'var(--green-700)', flexShrink:0 }} />
          <input
            value={cityInput}
            onChange={e => setCityInput(e.target.value)}
            placeholder="Enter your city, e.g. Sonipat"
            style={{ flex:1, border:'none', outline:'none', fontSize:14, fontFamily:'var(--font-body)', background:'transparent', color:'var(--ink-900)' }}
          />
          {cityInput && (
            <button type="button" onClick={clearCity} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-400)', display:'flex', padding:2 }}>
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
        <button type="submit"
          style={{ height:42, padding:'0 20px', background:'var(--green-700)', color:'#FFF', border:'none', borderRadius:'var(--r-md)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6 }}>
          <Search size={14} strokeWidth={2.5} /> Search
        </button>
      </form>

      {/* Redirect message */}
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
      <div className={styles.mapBox} role="img" aria-label="Map placeholder">
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
        <div className={styles.sectionTitle}>Loading stores…</div>
      )}

      {error && (
        <div style={{ padding:'var(--sp-5)', color:'var(--danger)', textAlign:'center' }}>
          Failed to load stores. Please try again.
        </div>
      )}

      {!loading && !error && (
        <>
          {!activeCity ? (
            <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)', background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16 }}>
              <MapPin size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)', display:'block' }} />
              <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:6 }}>Enter your city above</p>
              <p style={{ fontSize:13 }}>We'll show verified pharmacies in your area.</p>
            </div>
          ) : stores.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)', background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16 }}>
              <MapPin size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)', display:'block' }} />
              <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:6 }}>No stores found in {activeCity}</p>
              <p style={{ fontSize:13 }}>Try a nearby city or check your spelling.</p>
            </div>
          ) : (
            <>
              <div className={styles.sectionTitle}>
                <ShieldCheck size={18} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
                {stores.length} verified {stores.length === 1 ? 'pharmacy' : 'pharmacies'} in {activeCity}
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
    </div>
  );
}
