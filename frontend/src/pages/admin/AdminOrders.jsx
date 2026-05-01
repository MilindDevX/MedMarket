import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, ChevronUp, Package } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { SkeletonTable } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';
import styles from './AdminOrders.module.css';

const statusConfig = {
  confirmed:  { label:'Confirmed',  variant:'blue' },
  accepted:   { label:'Accepted',   variant:'otc' },
  packing:    { label:'Packing',    variant:'pending' },
  dispatched: { label:'Dispatched', variant:'approved' },
  delivered:  { label:'Delivered',  variant:'verified' },
  rejected:   { label:'Rejected',   variant:'rejected' },
  cancelled:  { label:'Cancelled',  variant:'rejected' },
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}

export default function AdminOrders() {
  usePageTitle('All Orders');
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('all');
  const [expanded,  setExpanded]  = useState(null);
  const [page,      setPage]      = useState(1);
  const PAGE_SIZE = 20;
  const { orders, loading }       = useAdminOrders();

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      o.id?.toLowerCase().includes(q) ||
      o.consumer?.name?.toLowerCase().includes(q) ||
      o.store?.name?.toLowerCase().includes(q);
    const matchStatus = status === 'all' || o.status === status;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const counts = {
    total:     orders.length,
    active:    orders.filter(o => !['delivered','rejected','cancelled'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => ['rejected','cancelled'].includes(o.status)).length,
  };

  if (loading) return <div className={styles.page}><SkeletonTable rows={8} cols={6} /></div>;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div style={{ marginBottom:'var(--sp-5)' }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>All Orders</h1>
        <p style={{ fontSize:13, color:'var(--ink-500)', marginTop:4 }}>{counts.total} total · {counts.active} active · {counts.delivered} delivered · {counts.cancelled} cancelled</p>
      </div>

      {/* KPIs */}
      <div className={styles.kpiRow}>
        {[
          { label:'Total Orders',    val:counts.total,     color:'var(--ink-900)' },
          { label:'Active',          val:counts.active,    color:'var(--blue-700)' },
          { label:'Delivered',       val:counts.delivered, color:'var(--success-dark)' },
          { label:'Cancelled/Rejected', val:counts.cancelled, color:'var(--danger)' },
        ].map(({ label, val, color }) => (
          <div key={label} className={styles.kpiCard}>
            <div className={styles.kpiVal} style={{ color }}>{val}</div>
            <div className={styles.kpiLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.searchInput} value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID, consumer, or store…" />
          {search && <button className={styles.clearBtn} onClick={() => setSearch('')}><X size={13}/></button>}
        </div>
        <select className={styles.filterSelect} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Orders list — card layout instead of cramped table */}
      {orders.length === 0 ? (
        <div className={styles.empty}>
          <Package size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)', display:'block', color:'var(--ink-300)' }} />
          <p style={{ fontSize:14, color:'var(--ink-500)', textAlign:'center' }}>
            No orders found. The backend endpoint <code>GET /api/v1/admin/orders</code> must be implemented to show orders here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No orders match your filters.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
          {paginated.map((o, i) => {
            const sc    = statusConfig[o.status] || { label: o.status, variant:'default' };
            const isExp = expanded === o.id;
            return (
              <motion.div key={o.id}
                style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:14, overflow:'hidden', transition:'box-shadow 0.15s' }}
                initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                whileHover={{ boxShadow:'var(--shadow-sm)' }}>

                {/* Main row */}
                <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1.2fr 1.2fr 0.8fr 0.8fr auto auto', alignItems:'center', gap:'var(--sp-3)', padding:'var(--sp-4) var(--sp-5)', cursor:'pointer' }}
                  onClick={() => setExpanded(isExp ? null : o.id)}>

                  {/* Order ID + date */}
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-900)', fontFamily:'monospace' }}>
                      #{o.id?.slice(0,8).toUpperCase()}
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink-400)', marginTop:2 }}>
                      {formatDate(o.created_at)}
                    </div>
                  </div>

                  {/* Consumer */}
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-800)' }}>{o.consumer?.name || '—'}</div>
                    <div style={{ fontSize:11, color:'var(--ink-400)', marginTop:1 }}>{o.consumer?.mobile || ''}</div>
                  </div>

                  {/* Store */}
                  <div>
                    <div style={{ fontSize:13, color:'var(--ink-700)' }}>{o.store?.name || '—'}</div>
                    <div style={{ fontSize:11, color:'var(--ink-400)', marginTop:1 }}>{o.store?.city || ''}</div>
                  </div>

                  {/* Items count */}
                  <div style={{ fontSize:13, color:'var(--ink-500)' }}>
                    {o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}
                  </div>

                  {/* Total */}
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)' }}>
                    ₹{Number(o.total_amount || 0).toFixed(0)}
                  </div>

                  {/* Status badge */}
                  <Badge variant={sc.variant}>{sc.label}</Badge>

                  {/* Expand toggle */}
                  <div style={{ color:'var(--ink-300)', display:'flex' }}>
                    {isExp ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExp && (
                    <motion.div
                      initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }} transition={{ duration:0.18 }}
                      style={{ overflow:'hidden' }}>
                      <div style={{ borderTop:'1px solid var(--ink-100)', padding:'var(--sp-4) var(--sp-5)', background:'var(--ink-50)' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'var(--sp-5)', marginBottom:'var(--sp-4)' }}>
                          <div>
                            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--ink-400)', marginBottom:4 }}>Payment</div>
                            <div style={{ fontSize:13, color:'var(--ink-800)', fontWeight:600 }}>{o.payment_method?.toUpperCase() || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--ink-400)', marginBottom:4 }}>Delivery Type</div>
                            <div style={{ fontSize:13, color:'var(--ink-800)', fontWeight:600 }}>{o.delivery_type || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--ink-400)', marginBottom:4 }}>Address</div>
                            <div style={{ fontSize:12, color:'var(--ink-700)' }}>{o.delivery_address || '—'}</div>
                          </div>
                        </div>

                        {/* Items */}
                        {o.items?.length > 0 && (
                          <div>
                            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--ink-400)', marginBottom:8 }}>Order Items</div>
                            <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
                              {o.items.map(item => (
                                <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--sp-2) var(--sp-3)', background:'var(--white)', borderRadius:8, fontSize:13 }}>
                                  <span style={{ fontWeight:600, color:'var(--ink-800)' }}>{item.medicine_name}</span>
                                  <span style={{ color:'var(--ink-500)' }}>× {item.quantity}</span>
                                  <span style={{ fontWeight:700, color:'var(--ink-900)' }}>₹{Number(item.line_total || 0).toFixed(0)}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'var(--sp-3)', paddingTop:'var(--sp-3)', borderTop:'1px solid var(--ink-100)' }}>
                              <span style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)' }}>Total: ₹{Number(o.total_amount || 0).toFixed(0)}</span>
                            </div>
                          </div>
                        )}

                        {o.rejection_reason && (
                          <div style={{ marginTop:'var(--sp-3)', padding:'var(--sp-3)', background:'var(--danger-light)', borderRadius:8, fontSize:13, color:'var(--danger)' }}>
                            <strong>Rejection reason:</strong> {o.rejection_reason}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={p => setPage(p)} />
    </div>
  );
}
