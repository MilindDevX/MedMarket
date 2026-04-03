import { useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, Store } from 'lucide-react';

import Badge from '../../components/ui/Badge';
import usePageTitle from '../../utils/usePageTitle';
import { SkeletonCard } from '../../components/ui/Skeleton';
import styles from './MedicineBrowse.module.css';
import { useMedicines } from '../../hooks/useMedicines';

const medicineCategories = ['All','Pain Relief','Antacid','Antihistamine','Hydration','Vitamins & Supplements','Baby Care','Skincare','Diabetic Care'];

const sortOptions = [
  { value: 'relevance',  label: 'Relevance' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc',   label: 'Name: A–Z' },
];

export default function MedicineBrowse() {
  usePageTitle('Browse Medicines');
  const [searchParams, setSearchParams] = useSearchParams();
  const [search,   setSearchRaw] = useState(searchParams.get('search')   || '');
  const [category, setCategoryRaw] = useState(searchParams.get('category') || 'All');
  const [sort, setSort]          = useState('relevance');
  const debounceRef              = useRef(null);
  const navigate                 = useNavigate();

  // Debounced URL sync — prevents focus loss on keystrokes
  const setSearch = useCallback((val) => {
    setSearchRaw(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = {};
      if (val) params.search = val;
      if (category !== 'All') params.category = category;
      setSearchParams(params, { replace: true });
    }, 400);
  }, [category, setSearchParams]);

  const setCategory = useCallback((val) => {
    setCategoryRaw(val);
    const params = {};
    if (search) params.search = search;
    if (val && val !== 'All') params.category = val;
    setSearchParams(params, { replace: true });
  }, [search, setSearchParams]);

  const { medicines, loading, error } = useMedicines(search, category);

  const filtered = [...medicines].sort((a, b) => {
    if (sort === 'price-asc')  return Number(a.mrp) - Number(b.mrp);
    if (sort === 'price-desc') return Number(b.mrp) - Number(a.mrp);
    if (sort === 'name-asc')   return a.name.localeCompare(b.name);
    return 0;
  });

  // Navigate to stores with medicine name as a filter hint
  const handleFindAtStore = (e, med) => {
    e.stopPropagation();
    navigate(`/consumer/stores?medicine=${encodeURIComponent(med.name)}`);
  };

  return (
    <div className={styles.page}>
      {/* Sticky header bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input className={styles.searchInput} value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicines, salts, generic names…" />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch('')}><X size={14} /></button>
            )}
          </div>
          <div className={styles.sortWrap}>
            <SlidersHorizontal size={14} />
            <select className={styles.sortSelect} value={sort} onChange={(e) => setSort(e.target.value)}>
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {/* Category pills */}
        <div className={styles.categories}>
          {medicineCategories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`${styles.catPill} ${category === cat ? styles.catPillActive : ''}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Results header */}
        <div className={styles.resultsHeader}>
          <span className={styles.resultsCount}>
            {loading ? 'Loading…' : `${filtered.length} medicines found`}
          </span>
          {(search || category !== 'All') && (
            <button className={styles.clearFilters} onClick={() => { setSearch(''); setCategory('All'); }}>
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className={styles.empty}>
            <p>Failed to load medicines.</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Medicine grid */}
        {!loading && !error && (
          <div className={styles.grid}>
            <AnimatePresence>
              {filtered.map((med, i) => (
                <motion.div key={med.id} className={styles.card} layout
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
                  onClick={() => navigate(`/consumer/medicines/${med.id}`)}
                  whileHover={{ y: -3 }}>
                  <div className={styles.cardCategory}>{med.category}</div>
                  <h3 className={styles.cardName}>{med.name}</h3>
                  <p className={styles.cardSalt}>{med.salt_composition}</p>
                  <p className={styles.cardMfr}>{med.manufacturer} · {med.pack_size}</p>
                  <div className={styles.cardMeta}>
                    <Badge variant="otc">OTC</Badge>
                  </div>
                  <div className={styles.cardFooter}>
                    <div>
                      <span className={styles.fromLabel}>MRP </span>
                      <span className={styles.price}>₹{Number(med.mrp).toFixed(0)}</span>
                    </div>
                    <motion.button
                      className={styles.addBtn}
                      style={{ background:'var(--green-50)', color:'var(--green-700)', border:'1.5px solid var(--green-200)', display:'flex', alignItems:'center', gap:4 }}
                      onClick={(e) => handleFindAtStore(e, med)}
                      whileTap={{ scale: 0.93 }}>
                      <Store size={12} strokeWidth={2.5} /> Find at store
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!loading && filtered.length === 0 && (
              <div className={styles.empty}>
                <Search size={36} strokeWidth={1} />
                <p>No medicines match your search.</p>
                <button onClick={() => { setSearch(''); setCategory('All'); }}>Clear filters</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
