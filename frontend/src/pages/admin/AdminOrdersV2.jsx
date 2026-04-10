import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, ChevronUp, Package, ShoppingCart, Activity, CheckCircle, XCircle } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { SkeletonTable } from '../../components/ui/Skeleton';
import styles from './AdminOrdersV2.module.css';

const statusConfig = {
  confirmed:  { label: 'Confirmed',  variant: 'blue',     accent: '#1A56DB' },
  accepted:   { label: 'Accepted',   variant: 'otc',      accent: '#0C6B4E' },
  packing:    { label: 'Packing',    variant: 'pending',  accent: '#D97706' },
  dispatched: { label: 'Dispatched', variant: 'approved', accent: '#059669' },
  delivered:  { label: 'Delivered',  variant: 'verified', accent: '#065F46' },
  rejected:   { label: 'Rejected',   variant: 'rejected', accent: '#EF4444' },
  cancelled:  { label: 'Cancelled',  variant: 'rejected', accent: '#EF4444' },
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminOrdersV2() {
  usePageTitle('All Orders');
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('all');
  const [expanded, setExpanded] = useState(null);
  const { orders, loading }     = useAdminOrders();

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      o.id?.toLowerCase().includes(q) ||
      o.consumer?.name?.toLowerCase().includes(q) ||
      o.store?.name?.toLowerCase().includes(q);
    const matchStatus = status === 'all' || o.status === status;
    return matchSearch && matchStatus;
  });

  const counts = {
    total:     orders.length,
    active:    orders.filter(o => !['delivered', 'rejected', 'cancelled'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => ['rejected', 'cancelled'].includes(o.status)).length,
  };

  if (loading) return <div className={styles.page}><SkeletonTable rows={8} cols={6} /></div>;

  const kpis = [
    { label: 'Total Orders',       val: counts.total,     sub: 'All time',          color: 'var(--ink-900)',      icon: ShoppingCart },
    { label: 'Active',             val: counts.active,    sub: 'In progress',       color: 'var(--blue-700)',     icon: Activity },
    { label: 'Delivered',          val: counts.delivered, sub: 'Successfully done', color: 'var(--success-dark)', icon: CheckCircle },
    { label: 'Cancelled/Rejected', val: counts.cancelled, sub: 'Not fulfilled',     color: 'var(--danger)',       icon: XCircle },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div>
        <h1 className={styles.title}>All Orders</h1>
        <p className={styles.subtitle}>{counts.total} total · {counts.active} active · {counts.delivered} delivered · {counts.cancelled} cancelled</p>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        {kpis.map(({ label, val, sub, color, icon: Icon }, i) => (
          <motion.div key={label} className={styles.kpiCard}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiLabel}>{label}</div>
              <div className={styles.kpiIcon} style={{ background: `${color}22` }}>
                <Icon size={15} strokeWidth={1.8} style={{ color }} />
              </div>
            </div>
            <div className={styles.kpiVal}>{val}</div>
            <div className={styles.kpiSub} style={{ color }}>{sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.searchInput} value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID, consumer, or store…" />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>
        <select className={styles.filterSelect} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Orders */}
      {orders.length === 0 ? (
        <div className={styles.empty}>
          <Package size={36} strokeWidth={1} className={styles.emptyText} style={{ color: 'var(--ink-300)', display: 'block', margin: '0 auto' }} />
          <p className={styles.emptyText}>
            No orders found. The backend endpoint <code>GET /api/v1/admin/orders</code> must be implemented.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No orders match your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {filtered.map((o, i) => {
            const sc    = statusConfig[o.status] || { label: o.status, variant: 'default', accent: 'var(--ink-300)' };
            const isExp = expanded === o.id;
            return (
              <motion.div key={o.id} className={styles.orderCard}
                style={{ borderLeftColor: sc.accent }}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>

                {/* Main row */}
                <div className={styles.orderRow} onClick={() => setExpanded(isExp ? null : o.id)}>
                  <div>
                    <div className={styles.orderId}>#{o.id?.slice(0, 8).toUpperCase()}</div>
                    <div className={styles.orderDate}>{formatDate(o.created_at)}</div>
                  </div>
                  <div>
                    <div className={styles.consumerName}>{o.consumer?.name || '—'}</div>
                    <div className={styles.consumerMobile}>{o.consumer?.mobile || ''}</div>
                  </div>
                  <div>
                    <div className={styles.storeName}>{o.store?.name || '—'}</div>
                    <div className={styles.storeCity}>{o.store?.city || ''}</div>
                  </div>
                  <div className={styles.itemCount}>
                    {o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}
                  </div>
                  <div className={styles.total}>₹{Number(o.total_amount || 0).toFixed(0)}</div>
                  <Badge variant={sc.variant}>{sc.label}</Badge>
                  <div className={styles.chevron}>
                    {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
                      <div className={styles.expandedInner}>
                        <div className={styles.detailGrid}>
                          <div>
                            <div className={styles.detailLabel}>Payment</div>
                            <div className={styles.detailVal}>{o.payment_method?.toUpperCase() || '—'}</div>
                          </div>
                          <div>
                            <div className={styles.detailLabel}>Delivery Type</div>
                            <div className={styles.detailVal}>{o.delivery_type || '—'}</div>
                          </div>
                          <div>
                            <div className={styles.detailLabel}>Address</div>
                            <div className={styles.detailValSm}>{o.delivery_address || '—'}</div>
                          </div>
                        </div>

                        {o.items?.length > 0 && (
                          <div>
                            <div className={styles.itemsLabel}>Order Items</div>
                            <div className={styles.itemsList}>
                              {o.items.map(item => (
                                <div key={item.id} className={styles.itemRow}>
                                  <span className={styles.itemName}>{item.medicine_name}</span>
                                  <span className={styles.itemQty}>× {item.quantity}</span>
                                  <span className={styles.itemTotal}>₹{Number(item.line_total || 0).toFixed(0)}</span>
                                </div>
                              ))}
                            </div>
                            <div className={styles.totalRow}>
                              Total: ₹{Number(o.total_amount || 0).toFixed(0)}
                            </div>
                          </div>
                        )}

                        {o.rejection_reason && (
                          <div className={styles.rejectionBox}>
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
    </div>
  );
}
