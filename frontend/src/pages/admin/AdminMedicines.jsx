import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Edit2, Trash2, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { medicineCategories } from '../../data/mockData';
import Badge from '../../components/ui/Badge';
import useToastStore from '../../store/toastStore';
import { useAdminMedicines } from '../../hooks/useAdminMedicines';
import { SkeletonTable } from '../../components/ui/Skeleton';
import styles from './AdminMedicines.module.css';

const scheduleOptions  = ['otc','schedule_h','schedule_h1','schedule_x'];
const formOptions      = ['tablet','capsule','syrup','gel','powder','injection','drops','inhaler'];
const scheduleLabel    = { otc:'OTC', schedule_h:'Sch. H', schedule_h1:'Sch. H1', schedule_x:'Sch. X' };
const scheduleVariant  = { otc:'otc', schedule_h:'rx', schedule_h1:'rx', schedule_x:'expired' };
const emptyForm        = { name:'', generic_name:'', salt_composition:'', manufacturer:'', category:'Pain Relief', form:'tablet', pack_size:'', mrp:'', schedule:'otc' };

export default function AdminMedicines() {
  usePageTitle('Medicine Database');
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('All');
  const [schedFilter, setSchedFilter] = useState('all');
  const [showModal,   setShowModal]   = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [form,        setForm]        = useState(emptyForm);
  const toast = useToastStore();
  const { medicines, loading, create, update, deactivate } = useAdminMedicines(search, catFilter);

  const filtered = medicines.filter(m => {
    const matchSched = schedFilter === 'all' || m.schedule === schedFilter;
    return matchSched;
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit   = (m)  => {
    setForm({ name:m.name, generic_name:m.generic_name, salt_composition:m.salt_composition,
      manufacturer:m.manufacturer, category:m.category, form:m.form, pack_size:m.pack_size, mrp:String(m.mrp), schedule:m.schedule });
    setEditingId(m.id); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.generic_name || !form.salt_composition || !form.manufacturer || !form.pack_size || !form.mrp) {
      toast.error('Please fill all required fields.'); return;
    }
    try {
      if (editingId) { await update(editingId, { ...form, mrp: Number(form.mrp) }); toast.success('Medicine updated.'); }
      else           { await create({ ...form, mrp: Number(form.mrp) }); toast.success('Medicine added to catalogue.'); }
      setShowModal(false);
    } catch (err) { toast.error(err.message); }
  };

  const handleDeactivate = async (m) => {
    if (!confirm(`Deactivate ${m.name}? It will no longer be visible to consumers.`)) return;
    try { await deactivate(m.id); toast.warning(`${m.name} deactivated.`); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className={styles.page}><SkeletonTable rows={6} cols={7} /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Medicine Database</h1>
          <p className={styles.subtitle}>{medicines.length} medicines in the CDSCO-approved catalogue</p>
        </div>
        <button className={styles.addBtn} onClick={openCreate}>
          <Plus size={14} strokeWidth={2.5} /> Add Medicine
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, salt, generic name..." />
        </div>
        <select className={styles.filterSelect} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {medicineCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={styles.filterSelect} value={schedFilter} onChange={e => setSchedFilter(e.target.value)}>
          <option value="all">All Schedules</option>
          {scheduleOptions.map(s => <option key={s} value={s}>{scheduleLabel[s]}</option>)}
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>{['Medicine','Generic / Salt','Category','Form','MRP','Schedule','Actions'].map(h => (
              <th key={h} className={styles.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <motion.tr key={m.id} className={styles.tr}
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}>
                <td className={styles.td}>
                  <div className={styles.medName}>{m.name}</div>
                  <div className={styles.medMfr}>{m.manufacturer}</div>
                </td>
                <td className={styles.td}>
                  <div className={styles.medGeneric}>{m.generic_name}</div>
                  <div className={styles.medSalt}>{m.salt_composition}</div>
                </td>
                <td className={styles.td}><span className={styles.category}>{m.category}</span></td>
                <td className={styles.td}><span className={styles.form}>{m.form}</span></td>
                <td className={styles.td}><span className={styles.mrp}>₹{m.mrp}</span></td>
                <td className={styles.td}><Badge variant={scheduleVariant[m.schedule] || 'default'}>{scheduleLabel[m.schedule] || m.schedule}</Badge></td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={() => openEdit(m)} title="Edit"><Edit2 size={14} strokeWidth={2} /></button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDeactivate(m)} title="Deactivate"><Trash2 size={14} strokeWidth={2} /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className={styles.empty}><Database size={32} strokeWidth={1} /><p>No medicines found.</p></div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className={styles.overlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowModal(false)}>
            <motion.div className={styles.modal} initial={{ scale:0.93, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{editingId ? 'Edit Medicine' : 'Add New Medicine'}</h2>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={18}/></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  {[
                    { label:'Medicine Name *',   key:'name',              placeholder:'e.g. Dolo 650' },
                    { label:'Generic Name *',    key:'generic_name',      placeholder:'e.g. Paracetamol' },
                    { label:'Salt Composition *',key:'salt_composition',  placeholder:'e.g. Paracetamol 650mg' },
                    { label:'Manufacturer *',    key:'manufacturer',      placeholder:'e.g. Micro Labs Ltd.' },
                    { label:'Pack Size *',       key:'pack_size',         placeholder:'e.g. Strip of 15' },
                    { label:'MRP (₹) *',         key:'mrp',               placeholder:'e.g. 33', type:'number' },
                  ].map(({ label, key, placeholder, type='text' }) => (
                    <div key={key} className={styles.formField}>
                      <label className={styles.formLabel}>{label}</label>
                      <input type={type} value={form[key]} onChange={e => setF(key, e.target.value)} placeholder={placeholder} className={styles.formInput} />
                    </div>
                  ))}
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Category *</label>
                    <select value={form.category} onChange={e => setF('category', e.target.value)} className={styles.formSelect}>
                      {medicineCategories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Form *</label>
                    <select value={form.form} onChange={e => setF('form', e.target.value)} className={styles.formSelect}>
                      {formOptions.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Schedule</label>
                    <select value={form.schedule} onChange={e => setF('schedule', e.target.value)} className={styles.formSelect}>
                      {scheduleOptions.map(s => <option key={s} value={s}>{scheduleLabel[s]}</option>)}
                    </select>
                  </div>
                </div>
                {form.schedule !== 'otc' && (
                  <div className={styles.schedWarn}>
                    <AlertTriangle size={14} strokeWidth={2} style={{ flexShrink:0 }} />
                    This medicine will not be visible to consumers — only OTC medicines are listed.
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button className={styles.saveBtn} onClick={handleSave}>
                  <CheckCircle size={15} strokeWidth={2.5} /> {editingId ? 'Save Changes' : 'Add Medicine'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
