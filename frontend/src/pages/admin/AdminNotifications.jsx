import usePageTitle from '../../utils/usePageTitle';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Store, ShoppingCart, CheckCheck, AlertTriangle, Trash2, X } from 'lucide-react';
import { useAdminPharmacies } from '../../hooks/useAdminPharmacies';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { SkeletonCard } from '../../components/ui/Skeleton';

const STORAGE_KEY = 'admin_notif_v2';

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ readIds: [...readIds], deletedIds: [...deletedIds] }));
  } catch {}
}

const icons = { store: Store, order: ShoppingCart, alert: AlertTriangle };

export default function AdminNotifications() {
  usePageTitle('Admin Notifications');
  const { apps,   loading: appsLoading   } = useAdminPharmacies('');
  const { orders, loading: ordersLoading } = useAdminOrders();
  const loading = appsLoading || ordersLoading;

  const [readIds,    setReadIds]    = useState(() => new Set(loadState().readIds));
  const [deletedIds, setDeletedIds] = useState(() => new Set(loadState().deletedIds));

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { saveState(readIds, deletedIds); }, [readIds, deletedIds]);

  const allNotifications = useMemo(() => {
    const list = [];

    apps.filter(a => a.status === 'pending').forEach(a => {
      list.push({
        id: `app-${a.id}`, type: 'store', urgent: true,
        title: `New pharmacy application — ${a.name}`,
        body: `${a.name} in ${a.city} has submitted a registration. Drug License: ${a.drug_license_no}.`,
        time: timeAgo(a.created_at), date: a.created_at,
      });
    });

    const cutoff = now - 24 * 3600 * 1000;
    orders
      .filter(o => new Date(o.created_at).getTime() > cutoff && o.status === 'confirmed')
      .forEach(o => {
        list.push({
          id: `ord-${o.id}`, type: 'order', urgent: false,
          title: 'New order placed',
          body: `Order #${o.id?.slice(0,8).toUpperCase()} from ${o.consumer?.name || 'a consumer'} at ${o.store?.name || 'unknown store'}. ₹${Number(o.total_amount || 0).toFixed(0)}.`,
          time: timeAgo(o.created_at), date: o.created_at,
        });
      });

    return list.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(b.date) - new Date(a.date);
    });
  }, [apps, orders, now]);

  const notifications = allNotifications.filter(n => !deletedIds.has(n.id));
  const unread = notifications.filter(n => !readIds.has(n.id));

  const markOne   = useCallback((id) => setReadIds(prev => new Set([...prev, id])), []);
  const markAll   = useCallback(() => setReadIds(new Set(notifications.map(n => n.id))), [notifications]);
  const deleteOne = useCallback((e, id) => { e.stopPropagation(); setDeletedIds(prev => new Set([...prev, id])); }, []);
  const deleteAll = useCallback(() => setDeletedIds(new Set(notifications.map(n => n.id))), [notifications]);

  if (loading) return <div><SkeletonCard lines={5} /></div>;

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-6)', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
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
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>No notifications</p>
          <p style={{ fontSize: 13 }}>New pharmacy applications and platform alerts will appear here.</p>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <AnimatePresence initial={false}>
          {notifications.map((n, i) => {
            const Icon   = icons[n.type] || Bell;
            const isRead = readIds.has(n.id);
            return (
              <motion.div key={n.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: isRead ? 0.72 : 1, y: 0 }}
                exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.18 } }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ boxShadow: 'var(--shadow-sm)' }}
                onClick={() => markOne(n.id)}
                style={{
                  background: isRead ? 'var(--ink-50)' : n.urgent ? '#FFF5F5' : 'var(--white)',
                  border: `1px solid ${n.urgent && !isRead ? '#FECACA' : 'var(--ink-200)'}`,
                  borderRadius: 14, padding: 'var(--sp-4)',
                  display: 'flex', gap: 'var(--sp-3)',
                  cursor: 'pointer', position: 'relative',
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: n.urgent ? '#FFF1F2' : 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} strokeWidth={1.8} style={{ color: n.urgent ? 'var(--danger)' : 'var(--blue-700)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: isRead ? 500 : 700, color: 'var(--ink-900)' }}>{n.title}</span>
                    {n.urgent && !isRead && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', background: '#FFF1F2', border: '1px solid #FECACA', padding: '1px 7px', borderRadius: 9999 }}>ACTION NEEDED</span>
                    )}
                    {!isRead && !n.urgent && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue-700)', display: 'inline-block' }} />
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.55, marginBottom: 5 }}>{n.body}</p>
                  <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>{n.time}</span>
                  {isRead && <span style={{ fontSize: 11, color: 'var(--success-dark)', marginLeft: 10 }}>✓ Read</span>}
                </div>
                <button
                  onClick={(e) => deleteOne(e, n.id)}
                  title="Dismiss"
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
