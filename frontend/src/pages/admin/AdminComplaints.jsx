import usePageTitle from '../../utils/usePageTitle';
import styles from './AdminComplaints.module.css';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import useToastStore from '../../store/toastStore';
import { api } from '../../utils/api';
import { SkeletonTable } from '../../components/ui/Skeleton';

const typeLabels = {
  wrong_medicine:   'Wrong Medicine',
  late_delivery:    'Late Delivery',
  expired_medicine: 'Expired Medicine',
  overcharged:      'Price Violation',
  store_behavior:   'Store Behaviour',
  other:            'Other',
};

const statusVariant = {
  open:      'blue',
  in_review: 'pending',
  resolved:  'approved',
  closed:    'verified',
};

export default function AdminComplaints() {
  usePageTitle('Complaints');

  const [complaints, setComplaints]   = useState([]);
  const [loading,    setLoading]      = useState(true);
  const [error,      setError]        = useState(null);
  const [search,     setSearch]       = useState('');
  const [statusFilter, setStatus]     = useState('all');
  const [selected,   setSelected]     = useState(null);
  const [resolution, setResolution]   = useState('');
  const [resolving,  setResolving]    = useState(false);
  const toast = useToastStore();

  const fetchComplaints = useCallback(() => {
    setLoading(true);
    api.get('/admin/complaints')
      .then(res => { setComplaints(res.data || []); setError(null); })
      .catch(err => {
        setComplaints([]);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const filtered = complaints.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.consumer?.name?.toLowerCase().includes(q) ||
      c.subject?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUpdateStatus = async (id, status, resolutionText) => {
    setResolving(true);
    try {
      await api.patch(`/admin/complaints/${id}`, { status, resolution: resolutionText });
      toast.success('Complaint updated.');
      setSelected(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className={styles.page}><SkeletonTable rows={5} cols={5} /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Complaints</h1>
          <p className={styles.subtitle}>
            {complaints.length} total · {complaints.filter(c => c.status === 'open').length} open
          </p>
        </div>
      </div>

      {/* Backend not implemented notice */}
      {error && (
        <div style={{ background:'var(--warning-light)', border:'1px solid #FDE68A', borderRadius:10, padding:'var(--sp-3) var(--sp-4)', fontSize:13, color:'#92400E', marginBottom:'var(--sp-4)', display:'flex', gap:8 }}>
          <span>⚠</span>
          <span>
            {error.includes('404') || error.includes('not found')
              ? 'Backend endpoint GET /api/v1/admin/complaints is not yet implemented. See BACKEND_FIXES.md.'
              : error}
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:'var(--sp-3)', marginBottom:'var(--sp-5)', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by consumer, subject or ID…"
            style={{ width:'100%', height:40, paddingLeft:14, border:'1.5px solid var(--ink-200)', borderRadius:'var(--r-md)', fontSize:14, fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box' }} />
        </div>
        {['all','open','in_review','resolved','closed'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            style={{ padding:'8px 14px', borderRadius:'var(--r-md)', fontSize:12, fontWeight:600, cursor:'pointer', border:'1.5px solid', borderColor: statusFilter===s ? 'var(--ink-900)' : 'var(--ink-200)', background: statusFilter===s ? 'var(--ink-900)' : 'var(--white)', color: statusFilter===s ? 'var(--white)' : 'var(--ink-500)', fontFamily:'var(--font-body)', textTransform:'capitalize' }}>
            {s.replace('_',' ')}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {complaints.length === 0 && !error && (
        <div style={{ textAlign:'center', padding:'var(--sp-12)', color:'var(--ink-400)', background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16 }}>
          <MessageSquare size={40} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)', display:'block' }} />
          <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:8 }}>No complaints yet</p>
          <p style={{ fontSize:13 }}>Consumer complaints will appear here once the backend endpoint is implemented.</p>
        </div>
      )}

      {/* Complaints list */}
      {filtered.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
          {filtered.map((c, i) => (
            <motion.div key={c.id}
              style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:14, padding:'var(--sp-4)', cursor:'pointer', transition:'box-shadow 0.15s' }}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
              whileHover={{ boxShadow:'var(--shadow-sm)' }}
              onClick={() => { setSelected(c); setResolution(c.resolution || ''); }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'var(--sp-3)' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--ink-900)' }}>{c.subject}</span>
                    <Badge variant={statusVariant[c.status] || 'default'}>{c.status?.replace('_',' ')}</Badge>
                    <span style={{ fontSize:11, color:'var(--ink-400)', background:'var(--ink-50)', padding:'1px 7px', borderRadius:9999 }}>
                      {typeLabels[c.type] || c.type}
                    </span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--ink-500)' }}>
                    {c.consumer?.name || 'Consumer'} · {c.order_id ? `Order #${c.order_id?.slice(0,8).toUpperCase()}` : 'No order'} · {new Date(c.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color:'var(--ink-300)', flexShrink:0 }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filtered.length === 0 && complaints.length > 0 && (
        <div style={{ textAlign:'center', padding:'var(--sp-8)', color:'var(--ink-400)' }}>No complaints match your filters.</div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setSelected(null)}>
            <motion.div style={{ background:'var(--white)', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'85vh', overflowY:'auto', boxShadow:'var(--shadow-lg)' }}
              initial={{ scale:0.93, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:26 }}
              onClick={e => e.stopPropagation()}>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--sp-5) var(--sp-5) 0' }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--ink-900)' }}>Complaint Detail</h3>
                <button onClick={() => setSelected(null)} style={{ display:'flex', padding:4, color:'var(--ink-400)', borderRadius:6, background:'none', border:'none', cursor:'pointer' }}><X size={18}/></button>
              </div>

              <div style={{ padding:'var(--sp-5)', display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
                <div style={{ background:'var(--ink-50)', borderRadius:10, padding:'var(--sp-4)' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)', marginBottom:6 }}>{selected.subject}</div>
                  <div style={{ fontSize:12, color:'var(--ink-500)', display:'flex', gap:'var(--sp-3)', flexWrap:'wrap' }}>
                    <span>{typeLabels[selected.type] || selected.type}</span>
                    <span>·</span>
                    <span>{selected.consumer?.name}</span>
                    {selected.order_id && <><span>·</span><span>#{selected.order_id?.slice(0,8).toUpperCase()}</span></>}
                    <span>·</span>
                    <span>{new Date(selected.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--ink-400)', marginBottom:6 }}>Description</div>
                  <p style={{ fontSize:14, color:'var(--ink-700)', lineHeight:1.65 }}>{selected.body}</p>
                </div>

                {selected.status !== 'resolved' && selected.status !== 'closed' && (
                  <>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)', display:'block', marginBottom:6 }}>Resolution note</label>
                      <textarea value={resolution} onChange={e => setResolution(e.target.value)}
                        placeholder="Describe how this was resolved…" rows={3}
                        style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--ink-200)', borderRadius:10, fontSize:14, fontFamily:'var(--font-body)', resize:'vertical', outline:'none', boxSizing:'border-box' }} />
                    </div>
                    <div style={{ display:'flex', gap:'var(--sp-2)', flexWrap:'wrap' }}>
                      <button onClick={() => handleUpdateStatus(selected.id, 'in_review', resolution)} disabled={resolving}
                        style={{ padding:'8px 16px', background:'var(--warning-light)', color:'#92400E', border:'1px solid #FDE68A', borderRadius:'var(--r-md)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        Mark In Review
                      </button>
                      <button onClick={() => handleUpdateStatus(selected.id, 'resolved', resolution)} disabled={resolving}
                        style={{ padding:'8px 16px', background:'var(--success-light)', color:'var(--success-dark)', border:'1px solid #6EE7B7', borderRadius:'var(--r-md)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        Mark Resolved
                      </button>
                      <button onClick={() => handleUpdateStatus(selected.id, 'closed', resolution)} disabled={resolving}
                        style={{ padding:'8px 16px', background:'var(--ink-100)', color:'var(--ink-600)', border:'1px solid var(--ink-200)', borderRadius:'var(--r-md)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        Close
                      </button>
                    </div>
                  </>
                )}

                {(selected.status === 'resolved' || selected.status === 'closed') && selected.resolution && (
                  <div style={{ background:'var(--success-light)', borderRadius:10, padding:'var(--sp-3)', fontSize:13, color:'var(--success-dark)' }}>
                    <strong>Resolution:</strong> {selected.resolution}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
