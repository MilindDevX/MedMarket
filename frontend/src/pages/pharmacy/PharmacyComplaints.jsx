import usePageTitle from '../../utils/usePageTitle';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, CheckCircle, Clock, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { SkeletonCard } from '../../components/ui/Skeleton';
import useToastStore from '../../store/toastStore';
import { api } from '../../utils/api';

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 2)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  return `${days}d ago`;
}

const typeLabel = {
  wrong_medicine:   'Wrong Medicine Delivered',
  expired_medicine: 'Expired Medicine Received',
  overcharged:      'Overcharged / Above MRP',
  late_delivery:    'Late Delivery',
  other:            'Other',
};

export default function PharmacyComplaints() {
  usePageTitle('Complaints');
  const toast = useToastStore();

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState(null);
  const [resolving,  setResolving]  = useState(null);
  const [resolution, setResolution] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/pharmacy/complaints')
      .then(res => setComplaints(res.data))
      .catch(() => toast.error('Failed to load complaints.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id) => {
    if (!resolution.trim()) { toast.error('Please enter a resolution note.'); return; }
    try {
      setResolving(id);
      await api.patch(`/pharmacy/complaints/${id}/resolve`, { resolution });
      toast.success('Complaint marked as resolved.');
      setResolution('');
      setExpanded(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to resolve complaint.');
    } finally {
      setResolving(null);
    }
  };

  const open     = complaints.filter(c => c.status === 'open');
  const resolved = complaints.filter(c => c.status === 'resolved');

  if (loading) return <div style={{ maxWidth:700 }}><SkeletonCard lines={5} /></div>;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>
          Complaints
        </h1>
        <p style={{ fontSize:13, color:'var(--ink-500)', marginTop:4 }}>
          Complaints filed by consumers about orders from your store.
        </p>
      </div>

      {/* Summary pills */}
      <div style={{ display:'flex', gap:'var(--sp-3)', marginBottom:'var(--sp-5)', flexWrap:'wrap' }}>
        {[
          { label:'Open',     count: open.length,     color:'var(--danger)',       bg:'var(--danger-light)',  border:'#FECACA' },
          { label:'Resolved', count: resolved.length, color:'var(--success-dark)', bg:'var(--success-light)', border:'#6EE7B7' },
        ].map(({ label, count, color, bg, border }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', background:bg, border:`1px solid ${border}`, borderRadius:9999, fontSize:13, fontWeight:700, color }}>
            {label === 'Open' ? <Clock size={14} strokeWidth={2} /> : <CheckCircle size={14} strokeWidth={2} />}
            {count} {label}
          </div>
        ))}
      </div>

      {complaints.length === 0 && (
        <div style={{ textAlign:'center', padding:'var(--sp-12)', color:'var(--ink-400)', background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16 }}>
          <MessageSquare size={40} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)', display:'block' }} />
          <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:6 }}>No complaints yet</p>
          <p style={{ fontSize:13 }}>Complaints filed by consumers about your orders will appear here.</p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
        <AnimatePresence initial={false}>
          {complaints.map((c, i) => {
            const isOpen     = c.status === 'open';
            const isExpanded = expanded === c.id;

            return (
              <motion.div key={c.id} layout
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: isOpen ? 'var(--white)' : 'var(--ink-50)',
                  border: `1px solid ${isOpen ? '#FECACA' : 'var(--ink-200)'}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                }}>

                {/* Header row — always visible */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                  style={{ padding:'var(--sp-4)', cursor:'pointer', display:'flex', alignItems:'flex-start', gap:'var(--sp-3)' }}>

                  {/* Status dot */}
                  <div style={{ width:10, height:10, borderRadius:'50%', background: isOpen ? 'var(--danger)' : 'var(--success-dark)', flexShrink:0, marginTop:5 }} />

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', flexWrap:'wrap', marginBottom:3 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)' }}>
                        {typeLabel[c.type] || c.type}
                      </span>
                      <span style={{
                        fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:9999,
                        color: isOpen ? 'var(--danger)' : 'var(--success-dark)',
                        background: isOpen ? '#FFF1F2' : 'var(--success-light)',
                        border: `1px solid ${isOpen ? '#FECACA' : '#6EE7B7'}`,
                      }}>
                        {isOpen ? 'Open' : 'Resolved'}
                      </span>
                    </div>
                    <p style={{ fontSize:13, color:'var(--ink-500)', marginBottom:4 }}>{c.subject}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', flexWrap:'wrap' }}>
                      <span style={{ fontSize:11, color:'var(--ink-400)' }}>
                        From <strong style={{ color:'var(--ink-700)' }}>{c.consumer?.name || 'Consumer'}</strong>
                      </span>
                      {c.order && (
                        <span style={{ fontSize:11, color:'var(--ink-400)' }}>
                          Order <strong style={{ color:'var(--ink-700)', fontFamily:'monospace' }}>#{c.order.id.slice(0,8).toUpperCase()}</strong>
                        </span>
                      )}
                      <span style={{ fontSize:11, color:'var(--ink-400)' }}>{timeAgo(c.created_at)}</span>
                    </div>
                  </div>

                  <div style={{ color:'var(--ink-400)', flexShrink:0 }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}>
                      <div style={{ padding:'0 var(--sp-4) var(--sp-4)', paddingLeft:'calc(var(--sp-4) + 10px + var(--sp-3))' }}>
                        <div style={{ borderTop:'1px solid var(--ink-200)', paddingTop:'var(--sp-4)' }}>

                          {/* Consumer message */}
                          <p style={{ fontSize:13, color:'var(--ink-700)', lineHeight:1.65, marginBottom:'var(--sp-4)', background:'var(--ink-50)', padding:'var(--sp-3) var(--sp-4)', borderRadius:10, borderLeft:'3px solid var(--ink-300)' }}>
                            {c.body}
                          </p>

                          {/* Resolution shown if resolved */}
                          {c.status === 'resolved' && c.resolution && (
                            <div style={{ marginBottom:'var(--sp-3)', background:'var(--success-light)', border:'1px solid #6EE7B7', borderRadius:10, padding:'var(--sp-3) var(--sp-4)' }}>
                              <div style={{ fontSize:11, fontWeight:700, color:'var(--success-dark)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Your Resolution</div>
                              <p style={{ fontSize:13, color:'var(--ink-700)', lineHeight:1.6 }}>{c.resolution}</p>
                            </div>
                          )}

                          {/* Resolve form — only for open complaints */}
                          {isOpen && (
                            <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
                              <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-700)' }}>
                                Add your resolution <span style={{ color:'var(--ink-400)', fontWeight:400 }}>(describe what action you took)</span>
                              </label>
                              <textarea
                                value={resolution}
                                onChange={e => setResolution(e.target.value)}
                                placeholder="e.g. We have arranged a replacement delivery for the correct medicine. Apologies for the inconvenience."
                                rows={3}
                                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'var(--font-body)', resize:'vertical', outline:'none', boxSizing:'border-box', color:'var(--ink-900)' }}
                              />
                              <button
                                onClick={() => handleResolve(c.id)}
                                disabled={resolving === c.id}
                                style={{ alignSelf:'flex-end', display:'flex', alignItems:'center', gap:6, padding:'8px 18px', background:'var(--green-700)', color:'#FFF', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor: resolving === c.id ? 'not-allowed' : 'pointer', fontFamily:'var(--font-body)', opacity: resolving === c.id ? 0.7 : 1 }}>
                                <Send size={13} strokeWidth={2.5} />
                                {resolving === c.id ? 'Saving…' : 'Mark as Resolved'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
