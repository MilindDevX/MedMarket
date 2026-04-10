import usePageTitle from '../../utils/usePageTitle';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, ShoppingBag, TrendingUp, CheckCheck, Trash2, X } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { usePharmacyOrders } from '../../hooks/usePharmacyOrders';
import { SkeletonCard } from '../../components/ui/Skeleton';

const STORAGE_KEY = 'pharmacy_notif_v2';

const typeConfig = {
  order:  { icon: ShoppingBag,   color: 'var(--blue-700)',     bg: 'var(--blue-50)' },
  expiry: { icon: AlertTriangle, color: 'var(--warning-dark)', bg: 'var(--warning-light)' },
  low:    { icon: TrendingUp,    color: '#7C3AED',             bg: '#F5F3FF' },
  admin:  { icon: CheckCircle,   color: 'var(--success-dark)', bg: 'var(--success-light)' },
};

function daysUntil(d) { return Math.floor((new Date(d) - new Date()) / 86400000); }
function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
  if (m < 60) return `${m} min ago`;
  if (h < 24) return `${h} hr ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { readIds: [], deletedIds: [] };
  } catch { return { readIds: [], deletedIds: [] }; }
}
function saveState(readIds, deletedIds) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      readIds: [...readIds],
      deletedIds: [...deletedIds],
    }));
  } catch {}
}

export default function PharmacyNotifications() {
  usePageTitle('Notifications');
  const { inventory, loading: invLoading }    = useInventory();
  const { orders,    loading: ordersLoading } = usePharmacyOrders();
  const loading = invLoading || ordersLoading;

  const [readIds,    setReadIds]    = useState(() => new Set(loadState().readIds));
  const [deletedIds, setDeletedIds] = useState(() => new Set(loadState().deletedIds));

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Persist both sets together
  useEffect(() => { saveState(readIds, deletedIds); }, [readIds, deletedIds]);

  const allNotifications = useMemo(() => {
    const list = [];
    const cutoff = now - 48 * 3600 * 1000;

    orders.filter(o => new Date(o.created_at).getTime() > cutoff).forEach(o => {
      list.push({
        id: `order-${o.id}`, type: 'order', urgent: o.status === 'confirmed',
        title: o.status === 'confirmed' ? 'New order received' : `Order ${o.status}`,
        body:  `#${o.id?.slice(0,8).toUpperCase()} from ${o.consumer?.name || 'a customer'} — ${o.items?.length || 0} item(s). ₹${Number(o.total_amount || 0).toFixed(0)}.`,
        time: timeAgo(o.created_at), date: o.created_at,
      });
    });

    inventory.forEach(item => {
      const days = daysUntil(item.exp_date);
      if (days < 0) {
        list.push({ id: `exp-${item.id}`, type: 'expiry', urgent: true,
          title: `Expired — ${item.medicine?.name}`,
          body: `Batch ${item.batch_number} expired ${Math.abs(days)}d ago. ${item.quantity} units. Remove from inventory.`,
          time: 'Now', date: item.exp_date });
      } else if (days < 30) {
        list.push({ id: `exp-${item.id}`, type: 'expiry', urgent: true,
          title: `Critical expiry — ${item.medicine?.name}`,
          body: `Batch ${item.batch_number} expires in ${days} days. ${item.quantity} units remaining.`,
          time: `${days}d left`, date: item.exp_date });
      } else if (days < 60) {
        list.push({ id: `exp-${item.id}`, type: 'expiry', urgent: false,
          title: `Expiry warning — ${item.medicine?.name}`,
          body: `Batch ${item.batch_number} expires in ${days} days. ${item.quantity} units on hand.`,
          time: `${days}d left`, date: item.exp_date });
      }
    });

    inventory.filter(i => i.quantity > 0 && i.quantity <= (i.low_stock_threshold || 10)).forEach(item => {
      list.push({ id: `low-${item.id}`, type: 'low', urgent: false,
        title: `Low stock — ${item.medicine?.name}`,
        body: `Only ${item.quantity} units remaining (threshold: ${item.low_stock_threshold || 10}).`,
        time: 'Now', date: new Date().toISOString() });
    });

    return list.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(b.date) - new Date(a.date);
    });
  }, [inventory, orders, now]);

  // Visible = not deleted
  const notifications = allNotifications.filter(n => !deletedIds.has(n.id));
  const unread = notifications.filter(n => !readIds.has(n.id));

  const markOne    = useCallback((id) => setReadIds(prev => new Set([...prev, id])), []);
  const markAll    = useCallback(() => setReadIds(new Set(notifications.map(n => n.id))), [notifications]);
  const deleteOne  = useCallback((e, id) => {
    e.stopPropagation();
    setDeletedIds(prev => new Set([...prev, id]));
  }, []);
  const deleteAll  = useCallback(() => {
    setDeletedIds(new Set(notifications.map(n => n.id)));
  }, [notifications]);

  if (loading) return <div style={{ maxWidth: 680 }}><SkeletonCard lines={5} /></div>;

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--sp-6)', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.3px' }}>
            Notifications
            {unread.length > 0 && (
              <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 700, color: '#FFFFFF', background: 'var(--danger)', padding: '2px 9px', borderRadius: 9999, verticalAlign: 'middle' }}>
                {unread.length}
              </span>
            )}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
            {notifications.length} alerts · {unread.length} unread
          </p>
        </div>

        {notifications.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            {unread.length > 0 && (
              <button onClick={markAll}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--green-50)', color: 'var(--green-700)', border: '1px solid var(--green-200)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <CheckCheck size={14} strokeWidth={2.5} /> Mark all read
              </button>
            )}
            <button onClick={deleteAll}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #FECACA', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <Trash2 size={14} strokeWidth={2} /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--ink-400)', background: 'var(--white)', border: '1px solid var(--ink-200)', borderRadius: 16 }}>
          <Bell size={40} strokeWidth={1} style={{ margin: '0 auto var(--sp-3)', display: 'block' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>All caught up</p>
          <p style={{ fontSize: 13 }}>Expiry warnings, new orders, and low-stock alerts will appear here.</p>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <AnimatePresence initial={false}>
          {notifications.map((n, i) => {
            const { icon: Icon, color, bg } = typeConfig[n.type] || typeConfig.admin;
            const isRead = readIds.has(n.id);
            return (
              <motion.div key={n.id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: isRead ? 0.72 : 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.18 } }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ boxShadow: 'var(--shadow-sm)' }}
                onClick={() => markOne(n.id)}
                style={{
                  background: n.urgent && !isRead ? '#FFF5F5' : isRead ? 'var(--ink-50)' : 'var(--white)',
                  border: `1px solid ${n.urgent && !isRead ? '#FECACA' : 'var(--ink-200)'}`,
                  borderRadius: 14, padding: 'var(--sp-4)',
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)',
                  cursor: 'pointer', transition: 'background 0.15s',
                  position: 'relative',
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} strokeWidth={1.8} style={{ color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: isRead ? 500 : 700, color: 'var(--ink-900)' }}>{n.title}</span>
                    {n.urgent && !isRead && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', background: '#FFF1F2', border: '1px solid #FECACA', padding: '1px 7px', borderRadius: 9999 }}>URGENT</span>
                    )}
                    {!isRead && !n.urgent && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue-700)', flexShrink: 0, display: 'inline-block' }} />
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.55, marginBottom: 6 }}>{n.body}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>{n.time}</span>
                    {isRead && <span style={{ fontSize: 11, color: 'var(--success-dark)' }}>✓ Read</span>}
                  </div>
                </div>
                {/* Delete button */}
                <button
                  onClick={(e) => deleteOne(e, n.id)}
                  title="Dismiss notification"
                  style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 'var(--r-md)', border: '1px solid var(--ink-200)', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-400)', flexShrink: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = '#FECACA'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--ink-400)'; e.currentTarget.style.borderColor = 'var(--ink-200)'; }}>
                  <X size={12} strokeWidth={2.5} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
