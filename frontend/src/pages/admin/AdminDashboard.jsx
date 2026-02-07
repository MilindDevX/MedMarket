import usePageTitle from '../../utils/usePageTitle';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Store, Users, ShoppingCart, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  usePageTitle('Platform Dashboard');
  const { data, loading: dashLoading } = useAdminDashboard();
  const { orders, loading: ordersLoading } = useAdminOrders();

  const loading = dashLoading || ordersLoading;

  // Orders-per-day chart derived from real order timestamps
  const areaData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label   = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const dateStr = d.toISOString().slice(0, 10);
      const count   = orders.filter(o => o.created_at?.slice(0, 10) === dateStr).length;
      days.push({ day: label, orders: count });
    }
    return days;
  }, [orders]);

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.kpiGrid}>{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} lines={3} />)}</div>
      <div className={styles.row2}><SkeletonCard lines={10} /><SkeletonCard lines={6} /></div>
    </div>
  );

  // Use dashboard API data when available, fall back to derived values
  const stores         = data?.stores || {};
  const approvedCount  = stores.approved  ?? 0;
  const pendingCount   = stores.pending   ?? 0;
  const rejectedCount  = stores.rejected  ?? 0;
  const totalStores    = stores.total     ?? 0;
  const consumerCount  = data?.consumers  ?? 0;
  const ordersToday    = data?.ordersToday ?? 0;
  const totalRevenue   = parseFloat(data?.totalRevenueInr ?? 0);
  const activeOrders   = orders.filter(o => !['delivered','rejected','cancelled'].includes(o.status));
  const recentPending  = data?.recentApplications ?? [];
  const recentOrders   = data?.recentOrders ?? [];

  const kpis = [
    { icon: Store,         label: 'Verified Pharmacies',   val: approvedCount,                           sub: `${pendingCount} pending`,         color: 'var(--green-700)' },
    { icon: Users,         label: 'Registered Consumers',  val: consumerCount,                           sub: 'Active accounts',                 color: 'var(--blue-700)' },
    { icon: ShoppingCart,  label: 'Orders Today',          val: ordersToday,                             sub: `${activeOrders.length} active`,   color: 'var(--purple, #7C3AED)' },
    { icon: Clock,         label: 'Pending Verifications', val: pendingCount,                            sub: 'Needs review',                    color: 'var(--warning-dark)' },
    { icon: AlertTriangle, label: 'Total Stores',          val: totalStores,                             sub: `${rejectedCount} rejected`,       color: 'var(--danger)' },
    { icon: TrendingUp,    label: 'Platform Revenue',      val: `₹${(totalRevenue / 100000).toFixed(1)}L`, sub: 'From delivered orders',         color: 'var(--success-dark)' },
  ];

  return (
    <div className={styles.page}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'var(--sp-3)' }}>
        <div>
          <h1 className={styles.title}>Platform Dashboard</h1>
          <p className={styles.subtitle}>Live overview — {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'var(--success)', background:'var(--success-light)', border:'1px solid #6EE7B7', padding:'6px 14px', borderRadius:9999 }}>
          <span style={{ width:7, height:7, borderRadius:9999, background:'var(--success)', display:'inline-block' }} />
          All systems operational
        </div>
      </div>

      <div className={styles.kpiGrid}>
        {kpis.map(({ icon: Icon, label, val, sub, color }, i) => (
          <motion.div key={label} className={styles.card}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.07 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-3)' }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--ink-400)' }}>{label}</div>
              <div style={{ width:32, height:32, borderRadius:8, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={15} strokeWidth={1.8} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize:28, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.5px' }}>{val}</div>
            <div style={{ fontSize:12, fontWeight:500, color, marginTop:6 }}>{sub}</div>
          </motion.div>
        ))}
      </div>

      <div className={styles.row2}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Orders — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0C6B4E" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0C6B4E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              <Area type="monotone" dataKey="orders" stroke="var(--green-700)" strokeWidth={2.5} fill="url(#og)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.card}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
            <div className={styles.cardTitle} style={{ margin:0 }}>Pending Verifications</div>
            <Link to="/admin/pharmacies" className={styles.viewAllLink} style={{ display:'inline' }}>View all</Link>
          </div>
          {recentPending.length === 0 && (
            <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>
              No pending applications 🎉
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
            {recentPending.slice(0, 5).map((app, i) => (
              <motion.div key={app.id} className={styles.queueItem}
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i * 0.08 }}>
                <div className={styles.queueAvatar}>{app.name?.charAt(0) || 'P'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className={styles.queueName} style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{app.name}</div>
                  <div className={styles.queueCity}>{app.owner?.name} · {app.city}</div>
                </div>
                <Link to={`/admin/pharmacies/${app.id}`} className={styles.reviewBtn}>Review</Link>
              </motion.div>
            ))}
          </div>
          {recentPending.length > 0 && (
            <Link to="/admin/pharmacies?status=pending" className={styles.viewAllLink}>See all pending →</Link>
          )}
        </div>
      </div>

      {/* Recent orders table */}
      {recentOrders.length > 0 && (
        <div className={styles.card} style={{ marginTop: 'var(--sp-4)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
            <div className={styles.cardTitle} style={{ margin:0 }}>Recent Orders</div>
            <Link to="/admin/orders" className={styles.viewAllLink} style={{ display:'inline' }}>View all</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--ink-200)' }}>
                  {['Order ID','Consumer','Store','Amount','Status'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:600, color:'var(--ink-400)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom:'1px solid var(--ink-100)' }}>
                    <td style={{ padding:'8px 10px', fontWeight:600, color:'var(--ink-700)', fontFamily:'monospace', fontSize:12 }}>
                      #{order.id.slice(0,8).toUpperCase()}
                    </td>
                    <td style={{ padding:'8px 10px', color:'var(--ink-700)' }}>{order.consumer?.name ?? '—'}</td>
                    <td style={{ padding:'8px 10px', color:'var(--ink-500)' }}>{order.store?.name ?? '—'}</td>
                    <td style={{ padding:'8px 10px', fontWeight:600, color:'var(--ink-900)' }}>₹{Number(order.total_amount).toFixed(0)}</td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{
                        padding:'2px 10px', borderRadius:9999, fontSize:11, fontWeight:600,
                        background: order.status === 'delivered' ? 'var(--success-light)' : order.status === 'rejected' ? 'var(--danger-light)' : 'var(--warning-light)',
                        color:       order.status === 'delivered' ? 'var(--success-dark)' : order.status === 'rejected' ? 'var(--danger-dark)'  : 'var(--warning-dark)',
                      }}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
