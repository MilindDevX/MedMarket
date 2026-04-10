import usePageTitle from '../../utils/usePageTitle';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Package, AlertTriangle, X, CheckCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../hooks/useInventory';
import { useMedicines } from '../../hooks/useMedicines';
import Badge from '../../components/ui/Badge';
import useToastStore from '../../store/toastStore';
import { SkeletonTable } from '../../components/ui/Skeleton';
import styles from './PharmacyInventory.module.css';

const getStatus = (item) => {
  if (!item.exp_date) return 'ok';
  const daysLeft = Math.floor((new Date(item.exp_date) - new Date()) / (1000*60*60*24));
  if (daysLeft < 0)  return 'expired';
  if (daysLeft < 30) return 'expiring-critical';
  if (daysLeft < 60) return 'expiring-soon';
  if (item.quantity < item.low_stock_threshold) return 'low';
  return 'ok';
};

const statusMap = {
  'ok':                { badge:'otc',      label:'In Stock' },
  'low':               { badge:'low',      label:'Low Stock' },
  'expiring-soon':     { badge:'pending',  label:'Exp Soon' },
  'expiring-critical': { badge:'expiring', label:'Exp Critical' },
  'expired':           { badge:'expired',  label:'Expired' },
};

const filterOptions = ['all','ok','low','expiring-soon','expiring-critical','expired','alerts'];
const filterLabels  = { all:'All', ok:'In Stock', low:'Low', 'expiring-soon':'Exp Soon', 'expiring-critical':'Exp Critical', expired:'Expired', alerts:'⚠ Alerts' };
const emptyForm     = { medicine_id:'', batch_number:'', mfg_date:'', exp_date:'', quantity:'', selling_price:'' };

export default function PharmacyInventory() {
  usePageTitle('Inventory');

  const { inventory, loading, addItem, updateItem, deleteItem } = useInventory();
  const { medicines } = useMedicines('', 'All');
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const toast = useToastStore();

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') { setShowAddModal(false); setEditItem(null); setDeleteTarget(null); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const enriched = inventory.map(i => ({ ...i, status: getStatus(i) }));

  const filtered = enriched.filter(item => {
    const q = search.toLowerCase();
    const name = item.medicine?.name?.toLowerCase() || '';
    const salt = item.medicine?.salt_composition?.toLowerCase() || '';
    const matchSearch = !search || name.includes(q) || salt.includes(q);
    const matchFilter = filter === 'all' || item.status === filter ||
      (filter === 'alerts' && ['expiring-soon','expiring-critical','expired','low'].includes(item.status));
    return matchSearch && matchFilter;
  });

  const alertCount = enriched.filter(i => ['expiring-soon','expiring-critical','expired','low'].includes(i.status)).length;

  const handleAdd = async () => {
    const med = medicines.find(m => m.id === form.medicine_id);
    if (!med || !form.batch_number || !form.exp_date || !form.quantity || !form.selling_price) {
      toast.error('Please fill all required fields.'); return;
    }
    if (form.mfg_date && form.exp_date && new Date(form.exp_date) <= new Date(form.mfg_date)) {
      toast.error('Expiry date must be after manufacturing date.'); return;
    }
    if (new Date(form.exp_date) <= new Date()) {
      toast.error('Cannot add an already-expired medicine to inventory.'); return;
    }
    if (Number(form.selling_price) > Number(med.mrp)) {
      toast.error(`Selling price cannot exceed MRP (₹${med.mrp}).`); return;
    }
    if (Number(form.selling_price) <= 0) {
      toast.error('Selling price must be greater than 0.'); return;
    }
    try {
      await addItem({ ...form, quantity: Number(form.quantity), selling_price: Number(form.selling_price) });
      toast.success(`${med.name} added to inventory.`);
      setShowAddModal(false); setForm(emptyForm);
    } catch (err) { toast.error(err.message); }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ medicine_id: item.medicine_id, batch_number: item.batch_number,
      mfg_date: item.mfg_date?.split('T')[0] || '', exp_date: item.exp_date?.split('T')[0] || '',
      quantity: String(item.quantity), selling_price: String(item.selling_price) });
  };

  const handleSaveEdit = async () => {
    if (!form.quantity || !form.selling_price) { toast.error('Quantity and price are required.'); return; }
    if (Number(form.selling_price) > Number(editItem.medicine?.mrp || 9999)) {
      toast.error(`Selling price cannot exceed MRP.`); return;
    }
    try {
      await updateItem(editItem.id, { quantity: Number(form.quantity), selling_price: Number(form.selling_price), exp_date: form.exp_date });
      toast.success(`${editItem.medicine?.name} updated.`);
      setEditItem(null); setForm(emptyForm);
    } catch (err) { toast.error(err.message); }
  };

  const confirmDelete = async () => {
    try {
      await deleteItem(deleteTarget.id);
      toast.warning(`${deleteTarget.medicine?.name} removed from inventory.`);
      setDeleteTarget(null);
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className={styles.page}><SkeletonTable rows={6} cols={7} /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Inventory</h1>
          <p className={styles.subtitle}>{inventory.length} medicines · {alertCount} alerts</p>
        </div>
        <div className={styles.headerActions}>
          {alertCount > 0 && (
            <Link to="/pharmacy/inventory/expiry" className={styles.alertLink}>
              <AlertTriangle size={14} strokeWidth={2.5} /> {alertCount} Expiry Alerts
            </Link>
          )}
          <button className={styles.addBtn} onClick={() => { setForm(emptyForm); setShowAddModal(true); }}>
            <Plus size={14} strokeWidth={2.5} /> Add Medicine
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search medicines or salt names..." aria-label="Search inventory" />
        </div>
        <div className={styles.filterBtns}>
          {filterOptions.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}>
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>{['Medicine','Salt','Batch No.','Expiry','Stock','Price','Status','Actions'].map(h => (
              <th key={h} className={styles.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => {
              const { badge, label } = statusMap[item.status] || statusMap.ok;
              const expClass = ['expiring-critical','expired'].includes(item.status)
                ? styles.expCrit : item.status === 'expiring-soon' ? styles.expWarn : styles.expOk;
              return (
                <motion.tr key={item.id} className={styles.tr}
                  initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}>
                  <td className={styles.td}>
                    <div className={styles.medName}>{item.medicine?.name}</div>
                    <div className={styles.medCat}>{item.medicine?.category}</div>
                  </td>
                  <td className={styles.td}><span className={styles.salt}>{item.medicine?.salt_composition}</span></td>
                  <td className={styles.td}><span className={styles.batch}>{item.batch_number}</span></td>
                  <td className={styles.td}><span className={expClass}>{item.exp_date?.split('T')[0]}</span></td>
                  <td className={styles.td}><span className={item.quantity < 15 ? styles.qtyLow : styles.qtyOk}>{item.quantity}</span></td>
                  <td className={styles.td}><span className={styles.mrp}>₹{item.selling_price}</span></td>
                  <td className={styles.td}><Badge variant={badge}>{label}</Badge></td>
                  <td className={styles.td}>
                    <div className={styles.rowActions}>
                      <button className={styles.editBtn} onClick={() => openEdit(item)}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => setDeleteTarget(item)}>
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className={styles.empty}><Package size={32} strokeWidth={1} /><p>No medicines match your search.</p></div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className={styles.overlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowAddModal(false)}>
            <motion.div className={styles.modal} initial={{ scale:0.93, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Add Medicine to Inventory</h2>
                <button className={styles.modalClose} onClick={() => setShowAddModal(false)}><X size={18}/></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Medicine *</label>
                  <select className={styles.formSelect} value={form.medicine_id} onChange={e => setF('medicine_id', e.target.value)}>
                    <option value="">Select a medicine…</option>
                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name} — {m.salt_composition} (MRP ₹{m.mrp})</option>)}
                  </select>
                </div>
                <div className={styles.formGrid}>
                  {[
                    { label:'Batch Number *', key:'batch_number', placeholder:'MFG/2024/B001' },
                    { label:'Quantity *',     key:'quantity',     placeholder:'120', type:'number' },
                    { label:'Mfg. Date',      key:'mfg_date',     type:'date' },
                    { label:'Expiry Date *',  key:'exp_date',     type:'date' },
                  ].map(({ label, key, placeholder, type='text' }) => (
                    <div key={key} className={styles.formField}>
                      <label className={styles.formLabel}>{label}</label>
                      <input type={type} className={styles.formInput} value={form[key]} onChange={e => setF(key, e.target.value)} placeholder={placeholder} />
                    </div>
                  ))}
                </div>
                {/* Selling price shown separately so we can display live MRP */}
                {(() => {
                  const selectedMed = medicines.find(m => m.id === form.medicine_id);
                  const mrp = selectedMed ? Number(selectedMed.mrp) : null;
                  const overMrp = mrp && form.selling_price && Number(form.selling_price) > mrp;
                  return (
                    <div className={styles.formField} style={{ marginTop:'var(--sp-2)' }}>
                      <label className={styles.formLabel}>
                        Selling Price (₹) *
                        {mrp && <span style={{ fontWeight:400, color:'var(--ink-400)', marginLeft:6 }}>MRP is ₹{mrp} — your price must be ≤ this</span>}
                      </label>
                      <input type="number" className={styles.formInput}
                        value={form.selling_price}
                        onChange={e => setF('selling_price', e.target.value)}
                        placeholder={mrp ? `Max ₹${mrp}` : 'Select a medicine first'}
                        max={mrp || undefined}
                        disabled={!form.medicine_id}
                        style={{ borderColor: overMrp ? 'var(--danger)' : undefined }} />
                      {overMrp && (
                        <div style={{ fontSize:12, color:'var(--danger)', marginTop:4, fontWeight:500 }}>
                          ⚠ Price exceeds MRP — DPCO violation. Reduce to ₹{mrp} or below.
                        </div>
                      )}
                      {mrp && !overMrp && form.selling_price && Number(form.selling_price) > 0 && (
                        <div style={{ fontSize:12, color:'var(--success-dark)', marginTop:4, fontWeight:500 }}>
                          ✓ {Math.round((1 - Number(form.selling_price)/mrp)*100)}% discount from MRP
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className={styles.saveBtn} onClick={handleAdd}><CheckCircle size={15} strokeWidth={2.5} /> Add to Inventory</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editItem && (
          <motion.div className={styles.overlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setEditItem(null)}>
            <motion.div className={`${styles.modal} ${styles.modalSm}`} initial={{ scale:0.93, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Edit — {editItem.medicine?.name}</h2>
                <button className={styles.modalClose} onClick={() => setEditItem(null)}><X size={18}/></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formField}><label className={styles.formLabel}>Quantity *</label><input type="number" className={styles.formInput} value={form.quantity} onChange={e => setF('quantity', e.target.value)} /></div>
                  <div className={styles.formField}><label className={styles.formLabel}>Selling Price (₹) *</label><input type="number" className={styles.formInput} value={form.selling_price} onChange={e => setF('selling_price', e.target.value)} /></div>
                  <div className={styles.formField}><label className={styles.formLabel}>Expiry Date</label><input type="date" className={styles.formInput} value={form.exp_date} onChange={e => setF('exp_date', e.target.value)} /></div>
                  <div className={styles.formField}><label className={styles.formLabel}>MRP (read-only)</label><input className={styles.formInput} value={`₹${editItem.medicine?.mrp}`} readOnly /></div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => setEditItem(null)}>Cancel</button>
                <button className={styles.saveBtn} onClick={handleSaveEdit}><CheckCircle size={15} strokeWidth={2.5} /> Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div className={styles.overlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setDeleteTarget(null)}>
            <motion.div className={`${styles.modal} ${styles.modalSm}`} initial={{ scale:0.93, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Remove from Inventory</h2>
                <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}><X size={18}/></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.deleteWarning}>
                  <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink:0, marginTop:2 }} />
                  <div>Remove <strong>{deleteTarget.medicine?.name}</strong> (Batch: {deleteTarget.batch_number}, {deleteTarget.quantity} units)? This cannot be undone.</div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>Keep It</button>
                <button className={styles.deleteConfirmBtn} onClick={confirmDelete}><Trash2 size={14} strokeWidth={2.5} /> Remove</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
