import usePageTitle from '../../utils/usePageTitle';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, CheckCircle, AlertTriangle, CheckCheck, Trash2, X } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { SkeletonCard } from '../../components/ui/Skeleton';

const STORAGE_KEY = 'consumer_notif_v2';

const typeConfig = {
  order:   { icon: ShoppingBag,   color: 'var(--blue-700)',     bg: 'var(--blue-50)' },
  success: { icon: CheckCircle,   color: 'var(--success-dark)', bg: 'var(--success-light)' },
  alert:   { icon: AlertTriangle, color: 'var(--warning-dark)', bg: 'var(--warning-light)' },
};

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

const statusMessages = {
  confirmed:  { title: 'Order confirmed',   type: 'order',   body: (o) => `Your order #${o.id?.slice(0,8).toUpperCase()} has been placed successfully.` },
  accepted:   { title: 'Order accepted',    type: 'success', body: (o) => `${o.store?.name || 'The pharmacy'} accepted your order #${o.id?.slice(0,8).toUpperCase()}.` },
  packing:    { title: 'Being packed',      type: 'order',   body: (o) => `Order #${o.id?.slice(0,8).toUpperCase()} is being prepared.` },
  dispatched: { title: 'Out for delivery',  type: 'success', body: (o) => `Order #${o.id?.slice(0,8).toUpperCase()} is on its way!` },
  delivered:  { title: 'Order delivered ✓', type: 'success', body: (o) => `Order #${o.id?.slice(0,8).toUpperCase()} delivered. We hope you feel better soon!` },
  rejected:   { title: 'Order rejected',    type: 'alert',   body: (o) => `Order #${o.id?.slice(0,8).toUpperCase()} was rejected${o.rejection_reason ? ': ' + o.rejection_reason : ''}. Try another pharmacy.` },
  cancelled:  { title: 'Order cancelled',   type: 'alert',   body: (o) => `Order #${o.id?.slice(0,8).toUpperCase()} has been cancelled.` },
};

export default function ConsumerNotifications() {
  usePageTitle('Notifications');
  const { orders, loading } = useOrders();

  const [readIds,    setReadIds]    = useState(() => new Set(loadState().readIds));
  const [deletedIds, setDeletedIds] = useState(() => new Set(loadState().deletedIds));

  useEffect(() => { saveState(readIds, deletedIds); }, [readIds, deletedIds]);

  const allNotifications = useMemo(() => {
    const list = [];
    orders.forEach(o => {
      const cfg = statusMessages[o.status];
      if (!cfg) return;
      list.push({
        id:     `${o.id}-${o.status}`,
        type:   cfg.type,
        title:  cfg.title,
        body:   cfg.body(o),
        time:   timeAgo(o.updated_at || o.created_at),
        date:   o.updated_at || o.created_at,
        urgent: ['rejected', 'cancelled'].includes(o.status),
      });
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [orders]);

  const notifications = allNotifications.filter(n => !deletedIds.has(n.id));
  const unread = notifications.filter(n => !readIds.has(n.id));

  const markOne   = useCallback((id) => setReadIds(prev => new Set([...prev, id])), []);
  const markAll   = useCallback(() => setReadIds(new Set(notifications.map(n => n.id))), [notifications]);
  const deleteOne = useCallback((e, id) => { e.stopPropagation(); setDeletedIds(prev => new Set([...prev, id])); }, []);
  const deleteAll = useCallback(() => setDeletedIds(new Set(notifications.map(n => n.id))), [notifications]);

  if (loading) return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--sp-6) var(--sp-5)' }}>
      <SkeletonCard lines={5} />
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--sp-6) var(--sp-5)' }}>
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
            {notifications.length} notifications · {unread.length} unread
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
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>No notifications yet</p>
          <p style={{ fontSize: 13 }}>Order status updates will appear here automatically.</p>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <AnimatePresence initial={false}>
          {notifications.map((n, i) => {
            const { icon: Icon, color, bg } = typeConfig[n.type] || typeConfig.order;
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
                  cursor: 'pointer', transition: 'all 0.15s',
                  position: 'relative',
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} strokeWidth={1.8} style={{ color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: isRead ? 500 : 700, color: 'var(--ink-900)' }}>{n.title}</span>
                    {!isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue-700)', flexShrink: 0, display: 'inline-block' }} />}
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
