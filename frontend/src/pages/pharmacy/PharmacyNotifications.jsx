import usePageTitle from '../../utils/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, ShoppingBag, TrendingUp, CheckCheck, Trash2, X } from 'lucide-react';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useNotifications } from '../../hooks/useNotifications';

const typeConfig = {
  'order.new':       { icon: ShoppingBag,   color: 'var(--blue-700)',     bg: 'var(--blue-50)' },
  'order.cancelled': { icon: ShoppingBag,   color: 'var(--danger)',       bg: 'var(--danger-light)' },
  'expiry':          { icon: AlertTriangle, color: 'var(--warning-dark)', bg: 'var(--warning-light)' },
  'low':             { icon: TrendingUp,    color: '#7C3AED',             bg: '#F5F3FF' },
  'store.approved':  { icon: CheckCircle,   color: 'var(--success-dark)', bg: 'var(--success-light)' },
  'store.rejected':  { icon: AlertTriangle, color: 'var(--danger)',       bg: 'var(--danger-light)' },
  'store.suspended': { icon: AlertTriangle, color: 'var(--danger)',       bg: 'var(--danger-light)' },
  default:           { icon: Bell,          color: 'var(--ink-500)',      bg: 'var(--ink-100)' },
};

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), days = Math.floor(diff/86400000);
  if (m < 2) return 'Just now';
  if (m < 60) return `${m} min ago`;
  if (h < 24) return `${h} hr ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function PharmacyNotifications() {
  usePageTitle('Notifications');
  const { notifications, loading, error, unreadCount, markOneRead, markAllRead, deleteOne, deleteAll } = useNotifications();

  if (loading) return <div style={{ maxWidth: 680 }}><SkeletonCard lines={5} /></div>;
  if (error) return <div style={{ color: 'var(--danger)', padding: 'var(--sp-5)' }}>Failed to load notifications.</div>;

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--sp-6)', flexWrap:'wrap', gap:'var(--sp-3)' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>
            Notifications
            {unreadCount > 0 && <span style={{ marginLeft:10, fontSize:13, fontWeight:700, color:'#FFF', background:'var(--danger)', padding:'2px 9px', borderRadius:9999, verticalAlign:'middle' }}>{unreadCount}</span>}
          </h1>
          <p style={{ fontSize:13, color:'var(--ink-500)', marginTop:4 }}>{notifications.length} alerts · {unreadCount} unread</p>
        </div>
        {notifications.length > 0 && (
          <div style={{ display:'flex', gap:'var(--sp-2)' }}>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'var(--green-50)', color:'var(--green-700)', border:'1px solid var(--green-200)', borderRadius:'var(--r-md)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                <CheckCheck size={14} strokeWidth={2.5} /> Mark all read
              </button>
            )}
            <button onClick={deleteAll} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'var(--danger-light)', color:'var(--danger)', border:'1px solid #FECACA', borderRadius:'var(--r-md)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
              <Trash2 size={14} strokeWidth={2} /> Clear all
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 && (
        <div style={{ textAlign:'center', padding:'var(--sp-12)', color:'var(--ink-400)', background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16 }}>
          <Bell size={40} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)', display:'block' }} />
          <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:6 }}>All caught up</p>
          <p style={{ fontSize:13 }}>Expiry warnings, new orders, and store alerts will appear here.</p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
        <AnimatePresence initial={false}>
          {notifications.map((n, i) => {
            const cfg = typeConfig[n.type] || typeConfig.default;
            const Icon = cfg.icon;
            const isRead = !!n.read_at;
            const isUrgent = !isRead && (n.type.includes('reject') || n.type.includes('suspend') || n.type === 'order.new');
            return (
              <motion.div key={n.id} layout
                initial={{ opacity:0, y:8 }} animate={{ opacity: isRead ? 0.72 : 1, y:0 }}
                exit={{ opacity:0, x:40, scale:0.96, transition:{ duration:0.18 } }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ boxShadow:'var(--shadow-sm)' }}
                onClick={() => !isRead && markOneRead(n.id)}
                style={{ background: isUrgent ? '#FFF5F5' : isRead ? 'var(--ink-50)' : 'var(--white)', border:`1px solid ${isUrgent ? '#FECACA' : 'var(--ink-200)'}`, borderRadius:14, padding:'var(--sp-4)', display:'flex', alignItems:'flex-start', gap:'var(--sp-3)', cursor: isRead ? 'default' : 'pointer', position:'relative' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={16} strokeWidth={1.8} style={{ color: cfg.color }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', marginBottom:3, flexWrap:'wrap' }}>
                    <span style={{ fontSize:14, fontWeight: isRead ? 500 : 700, color:'var(--ink-900)' }}>{n.title}</span>
                    {isUrgent && <span style={{ fontSize:10, fontWeight:700, color:'var(--danger)', background:'#FFF1F2', border:'1px solid #FECACA', padding:'1px 7px', borderRadius:9999 }}>URGENT</span>}
                    {!isRead && !isUrgent && <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--blue-700)', flexShrink:0, display:'inline-block' }} />}
                  </div>
                  <p style={{ fontSize:13, color:'var(--ink-500)', lineHeight:1.55, marginBottom:6 }}>{n.body}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
                    <span style={{ fontSize:11, color:'var(--ink-400)' }}>{timeAgo(n.created_at)}</span>
                    {isRead && <span style={{ fontSize:11, color:'var(--success-dark)' }}>✓ Read</span>}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteOne(n.id); }} title="Dismiss"
                  style={{ position:'absolute', top:10, right:10, width:26, height:26, borderRadius:'var(--r-md)', border:'1px solid var(--ink-200)', background:'var(--white)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--ink-400)', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--danger-light)'; e.currentTarget.style.color='var(--danger)'; e.currentTarget.style.borderColor='#FECACA'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='var(--white)'; e.currentTarget.style.color='var(--ink-400)'; e.currentTarget.style.borderColor='var(--ink-200)'; }}>
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
