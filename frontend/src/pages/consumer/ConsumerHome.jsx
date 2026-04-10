import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Star, MapPin, ArrowRight, Pill, Store, ChevronRight, Zap } from 'lucide-react';
import usePageTitle from '../../utils/usePageTitle';
import useAuthStore from '../../store/authStore';
import { useMedicines } from '../../hooks/useMedicines';
import { useStores } from '../../hooks/useStores';
import styles from './ConsumerHome.module.css';

const quickCategories = [
  { label:'Pain Relief', emoji:'💊', q:'Pain Relief' },
  { label:'Antacids',    emoji:'🫙', q:'Antacid' },
  { label:'Vitamins',    emoji:'⚡', q:'Vitamins & Supplements' },
  { label:'Hydration',   emoji:'💧', q:'Hydration' },
  { label:'Allergy',     emoji:'🌿', q:'Antihistamine' },
];

export default function ConsumerHome() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  usePageTitle('Find Medicines Near You');

  const { user }                   = useAuthStore();
  const userCity                   = user?.city || '';
  const { medicines: popularMeds } = useMedicines('', '');
  const { stores: nearbyStores }   = useStores(userCity);

  const handleSearch = (e) => {
    e.preventDefault();
    const path = query.trim()
      ? `/consumer/medicines?search=${encodeURIComponent(query.trim())}`
      : '/consumer/medicines';
    navigate(path);
  };

  return (
    <div className={styles.page}>
      <motion.div className={styles.heroSection}
        initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ type:'spring', stiffness:260, damping:22 }}>

        <div className={styles.locationPill}>
          <MapPin size={12} strokeWidth={2.5} />
          {userCity
            ? `${nearbyStores.length} store${nearbyStores.length !== 1 ? 's' : ''} in ${userCity}`
            : nearbyStores.length > 0
              ? `${nearbyStores.length} verified stores available`
              : 'Loading stores...'
          }
        </div>

        <h1 className={styles.heroTitle}>Find medicines near you</h1>
        <p className={styles.heroSubtitle}>Only from verified, CDSCO-registered pharmacies</p>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Search size={18} className={styles.searchIcon} />
          <input className={styles.searchInput} value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search medicines, e.g. Paracetamol, Cetirizine…"
            aria-label="Search medicines" />
          <button type="submit" className={styles.searchBtn}>Search</button>
        </form>

        <div className={styles.categories}>
          {quickCategories.map(({ label, emoji, q }) => (
            <button key={label} className={styles.catPill}
              onClick={() => navigate(`/consumer/medicines?category=${encodeURIComponent(q)}`)}>
              {emoji} {label}
            </button>
          ))}
          <button className={styles.catPill} onClick={() => navigate('/consumer/medicines')}>
            All medicines <ArrowRight size={13} strokeWidth={2} />
          </button>
        </div>
      </motion.div>

      {/* Nearby stores */}
      {nearbyStores.length > 0 && (
        <div className={styles.storesSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Store size={18} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
              Verified stores near you
            </h2>
            <button className={styles.viewAllBtn} onClick={() => navigate('/consumer/stores')}>
              View on map <ArrowRight size={13} strokeWidth={2} />
            </button>
          </div>
          <div className={styles.storesGrid}>
            {nearbyStores.slice(0, 3).map((store, i) => (
              <motion.div key={store.id} className={styles.storeCard}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
                onClick={() => navigate(`/consumer/stores/${store.id}`)}>
                <div className={styles.storeCardTop}>
                  <div className={styles.storeAvatar}>{store.name.charAt(0)}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className={styles.storeName}>{store.name}</div>
                    <div className={styles.storeAddr}>{store.address_line}, {store.city}</div>
                  </div>
                  <ChevronRight size={16} strokeWidth={2} style={{ color:'#9CA3AF', flexShrink:0, marginTop:4 }} />
                </div>
                <div className={styles.storeMeta}>
                  <span className={styles.verifiedChip}><ShieldCheck size={10} strokeWidth={2.5} /> Verified</span>
                  <span className={styles.ratingChip}>
                    <Star size={11} strokeWidth={2} style={{ color:'#F59E0B', fill:'#F59E0B' }} />
                    {Number(store.avg_rating || 0).toFixed(1)}
                  </span>
                  <span className={styles.distanceChip}>📍 {store.city}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Popular medicines */}
      {popularMeds.length > 0 && (
        <div className={styles.medsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Pill size={18} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
              Popular OTC medicines
            </h2>
            <button className={styles.viewAllBtn} onClick={() => navigate('/consumer/medicines')}>
              Browse all <ArrowRight size={13} strokeWidth={2} />
            </button>
          </div>
          <div className={styles.medsGrid}>
            {popularMeds.slice(0, 6).map((med, i) => (
              <motion.div key={med.id} className={styles.medCard}
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                onClick={() => navigate(`/consumer/medicines/${med.id}`)}>
                <div className={styles.medCategory}>{med.category}</div>
                <div className={styles.medName}>{med.name}</div>
                <div className={styles.medSalt}>{med.salt_composition}</div>
                <div className={styles.medPriceRow}>
                  <span className={styles.medPrice}>from ₹{Number(med.mrp).toFixed(0)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Quick access */}
      <motion.div className={styles.quickAccess}
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
        <div className={`${styles.quickCard} ${styles.quickCardDark}`} onClick={() => navigate('/consumer/orders')}>
          <Zap size={20} strokeWidth={1.8} style={{ color:'#22c55e' }} />
          <div style={{ flex:1 }}>
            <div className={`${styles.quickTitle} ${styles.quickTitleDark}`}>Track your orders</div>
            <div className={`${styles.quickSub} ${styles.quickSubDark}`}>View active and past orders</div>
          </div>
          <ArrowRight size={16} strokeWidth={2} style={{ color:'rgba(255,255,255,0.3)' }} />
        </div>
        <div className={`${styles.quickCard} ${styles.quickCardLight}`} onClick={() => navigate('/consumer/profile')}>
          <ShieldCheck size={20} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
          <div style={{ flex:1 }}>
            <div className={`${styles.quickTitle} ${styles.quickTitleLight}`}>Your profile</div>
            <div className={`${styles.quickSub} ${styles.quickSubLight}`}>Addresses, orders, settings</div>
          </div>
          <ArrowRight size={16} strokeWidth={2} style={{ color:'var(--green-300)' }} />
        </div>
      </motion.div>
    </div>
  );
}
