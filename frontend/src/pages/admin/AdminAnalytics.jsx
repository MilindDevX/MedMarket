import usePageTitle from '../../utils/usePageTitle';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, Store, ShoppingCart, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
  AreaChart, Area, LineChart, Line
} from 'recharts';
import { useAdminPharmacies } from '../../hooks/useAdminPharmacies';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { SkeletonCard } from '../../components/ui/Skeleton';

const PIE_COLORS = ['#0C6B4E','#1A56DB','#8B5CF6','#F59E0B','#10B981','#EF4444'];
const card      = { background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' };
const cardTitle = { fontSize:16, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.2px', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', gap:8 };

export default function AdminAnalytics() {
  usePageTitle('Platform Analytics');
  const { apps,   loading: appsLoading   } = useAdminPharmacies('');
  const { orders, loading: ordersLoading } = useAdminOrders();
  const { users,  loading: usersLoading  } = useAdminUsers();
  const loading = appsLoading || ordersLoading || usersLoading;

  const stats = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const rejected  = orders.filter(o => o.status === 'rejected');
    const totalGmv  = delivered.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const avgOrder  = delivered.length > 0 ? totalGmv / delivered.length : 0;

    // Platform fulfillment/rejection rates
    const terminal        = delivered.length + rejected.length + orders.filter(o => o.status === 'cancelled').length;
    const fulfillmentRate = terminal > 0 ? Math.round(delivered.length / terminal * 100) : 0;
    const rejectionRate   = terminal > 0 ? Math.round(rejected.length  / terminal * 100) : 0;

    // 14-day GMV trend
    const gmvByDay = [];
    for (let i = 13; i >= 0; i--) {
      const d       = new Date();
      d.setDate(d.getDate() - i);
      const label   = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      const dateStr = d.toISOString().slice(0, 10);
      const rev     = delivered
        .filter(o => o.created_at?.slice(0, 10) === dateStr)
        .reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const ordCnt  = orders.filter(o => o.created_at?.slice(0, 10) === dateStr).length;
      gmvByDay.push({ day: label, gmv: Math.round(rev), orders: ordCnt });
    }

    // City-wise order distribution
    const cityMap = {};
    orders.forEach(o => {
      const city = o.store?.city || 'Unknown';
      if (!cityMap[city]) cityMap[city] = { city, orders: 0, gmv: 0 };
      cityMap[city].orders += 1;
      if (o.status === 'delivered') cityMap[city].gmv += Number(o.total_amount || 0);
    });
    const cityRanking = Object.values(cityMap)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 8);

    // Platform-wide top medicines
    const medMap = {};
    delivered.forEach(o => {
      o.items?.forEach(item => {
        const key = item.medicine_name;
        if (!medMap[key]) medMap[key] = { name: key, units: 0, revenue: 0 };
        medMap[key].units   += item.quantity;
        medMap[key].revenue += Number(item.line_total || 0);
      });
    });
    const topMedicines = Object.values(medMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 8);

    // Store status breakdown
    const storeStatusMap = { pending:0, approved:0, rejected:0, suspended:0 };
    apps.forEach(a => { if (storeStatusMap[a.status] !== undefined) storeStatusMap[a.status]++; });
    const storeStatusDist = Object.entries(storeStatusMap)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);

    // Pharmacy approval turnaround (approved stores)
    const approvedStores = apps.filter(a => a.status === 'approved' && a.verified_at && a.created_at);
    const avgTurnaround  = approvedStores.length > 0
      ? approvedStores.reduce((s, a) => {
          const days = Math.round((new Date(a.verified_at) - new Date(a.created_at)) / 86400000);
          return s + days;
        }, 0) / approvedStores.length
      : 0;

    // New consumer registrations — last 7 days
    const regByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d       = new Date();
      d.setDate(d.getDate() - i);
      const label   = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      const dateStr = d.toISOString().slice(0, 10);
      const count   = (users || []).filter(u => u.created_at?.slice(0, 10) === dateStr).length;
      regByDay.push({ day: label, registrations: count });
    }

    // Activation rate: consumers who placed ≥1 order
    const consumersWhoOrdered = new Set(orders.map(o => o.consumer_id)).size;
    const totalConsumers      = (users || []).length;
    const activationRate      = totalConsumers > 0 ? Math.round(consumersWhoOrdered / totalConsumers * 100) : 0;

    return {
      totalGmv, avgOrder, totalOrders: orders.length, deliveredOrders: delivered.length,
      fulfillmentRate, rejectionRate,
      totalStores: apps.length, approvedStores: storeStatusMap.approved, pendingStores: storeStatusMap.pending,
      avgTurnaround: Math.round(avgTurnaround),
      totalConsumers, activationRate,
      gmvByDay, cityRanking, topMedicines, storeStatusDist, regByDay,
    };
  }, [apps, orders, users]);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'var(--sp-4)' }}>
        {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} lines={3} />)}
      </div>
      <SkeletonCard lines={8} /><SkeletonCard lines={6} />
    </div>
  );

  const {
    totalGmv, avgOrder: _avgOrder, totalOrders, deliveredOrders: _del,
    fulfillmentRate, rejectionRate,
    totalStores: _ts, approvedStores, pendingStores, avgTurnaround,
    totalConsumers: _tc, activationRate,
    gmvByDay, cityRanking, topMedicines, storeStatusDist, regByDay,
  } = stats;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>Platform Analytics</h1>
        <p style={{ fontSize:13, color:'var(--ink-500)', marginTop:4 }}>Live platform-wide metrics across all stores and consumers.</p>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'var(--sp-4)' }}>
        {[
          { icon:TrendingUp,    label:'Total GMV',             val:`₹${(totalGmv/100000).toFixed(1)}L`,  color:'var(--green-700)' },
          { icon:ShoppingCart,  label:'Total Orders',          val:totalOrders,                           color:'var(--blue-700)' },
          { icon:CheckCircle,   label:'Platform Fulfillment',  val:`${fulfillmentRate}%`,                 color:'var(--success-dark)' },
          { icon:Store,         label:'Active Stores',         val:approvedStores,                        color:'var(--green-700)' },
          { icon:Users,         label:'Consumer Activation',   val:`${activationRate}%`,                  color:'#7C3AED' },
          { icon:Clock,         label:'Avg Approval Time',     val:`${avgTurnaround}d`,                   color:'var(--warning-dark)' },
        ].map(({ icon:Icon, label, val, color }, i) => (
          <motion.div key={label} style={card}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-2)' }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--ink-400)' }}>{label}</div>
              <div style={{ width:30, height:30, borderRadius:8, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={14} strokeWidth={1.8} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize:24, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.5px' }}>{val}</div>
          </motion.div>
        ))}
      </div>

      {/* ── GMV Trend — 14 days ── */}
      <div style={card}>
        <div style={cardTitle}>
          <TrendingUp size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
          Platform GMV — Last 14 Days
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={gmvByDay}>
            <defs>
              <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0C6B4E" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#0C6B4E" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false}
              interval={Math.ceil(gmvByDay.length / 7) - 1} />
            <YAxis tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(1)}k` : `₹${v}`} />
            <Tooltip formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'GMV']}
              contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
            <Area type="monotone" dataKey="gmv" stroke="#0C6B4E" strokeWidth={2.5} fill="url(#gmvGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── City ranking + Store status ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-5)' }}>
        <div style={card}>
          <div style={cardTitle}><MapPin size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Orders by City</div>
          {cityRanking.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>No orders yet.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
              {cityRanking.map((c, i) => {
                const max = cityRanking[0].orders;
                return (
                  <div key={c.city}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{c.city}</span>
                      <span style={{ fontSize:12, color:'var(--ink-500)' }}>{c.orders} orders · ₹{Math.round(c.gmv/1000)}k</span>
                    </div>
                    <div style={{ height:5, background:'var(--ink-100)', borderRadius:9999 }}>
                      <div style={{ height:5, background: PIE_COLORS[i % PIE_COLORS.length], borderRadius:9999, width:`${max > 0 ? (c.orders/max)*100 : 0}%`, transition:'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={cardTitle}><Store size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Store Status Distribution</div>
          {storeStatusDist.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>No stores yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={storeStatusDist} cx="50%" cy="50%" outerRadius={78}
                  dataKey="value" nameKey="name" paddingAngle={2}>
                  {storeStatusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
                <Tooltip contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Platform-wide top medicines ── */}
      <div style={card}>
        <div style={cardTitle}><TrendingUp size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Most Ordered Medicines (Platform-Wide)</div>
        {topMedicines.length === 0 ? (
          <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>No delivered orders yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topMedicines} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize:11, fill:'var(--ink-700)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => [v, 'Units sold']}
                contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              <Bar dataKey="units" fill="#0C6B4E" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Consumer registrations + Platform health ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-5)' }}>
        <div style={card}>
          <div style={cardTitle}><Users size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />New Consumer Registrations — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={regByDay} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip formatter={v => [v, 'Registrations']}
                contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              <Bar dataKey="registrations" fill="#1A56DB" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <div style={cardTitle}><CheckCircle size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Platform Health</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
            {[
              { label:'Fulfillment Rate',     val:fulfillmentRate, color:'var(--success-dark)', bg:'var(--success-light)', help:'Delivered ÷ (Delivered + Rejected + Cancelled)' },
              { label:'Rejection Rate',       val:rejectionRate,   color:'var(--danger-dark)',  bg:'var(--danger-light)',  help:'Platform-wide pharmacy rejection rate' },
              { label:'Consumer Activation',  val:activationRate,  color:'var(--blue-700)',     bg:'var(--blue-50)',       help:'% of consumers who placed ≥ 1 order' },
            ].map(({ label, val, color, bg, help }) => (
              <div key={label}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{label}</div>
                    <div style={{ fontSize:11, color:'var(--ink-400)' }}>{help}</div>
                  </div>
                  <span style={{ fontSize:18, fontWeight:700, color, background:bg, padding:'3px 12px', borderRadius:9999, flexShrink:0 }}>{val}%</span>
                </div>
                <div style={{ height:5, background:'var(--ink-100)', borderRadius:9999 }}>
                  <div style={{ height:5, background:color, borderRadius:9999, width:`${val}%`, transition:'width 0.6s ease' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop:'var(--sp-2)', paddingTop:'var(--sp-3)', borderTop:'1px solid var(--ink-100)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-3)' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:700, color:'var(--ink-900)' }}>{pendingStores}</div>
                <div style={{ fontSize:11, color:'var(--ink-400)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Pending Reviews</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:700, color:'var(--ink-900)' }}>{avgTurnaround}d</div>
                <div style={{ fontSize:11, color:'var(--ink-400)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Avg Approval Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
