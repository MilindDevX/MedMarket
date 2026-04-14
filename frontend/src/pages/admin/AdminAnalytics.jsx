import usePageTitle from '../../utils/usePageTitle';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, Store, ShoppingCart, Package } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAdminPharmacies } from '../../hooks/useAdminPharmacies';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { SkeletonCard } from '../../components/ui/Skeleton';

const PIE_COLORS = ['#0C6B4E','#1A56DB','#8B5CF6','#F59E0B','#10B981','#EF4444'];
const card = { background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' };
const cardTitle = { fontSize:16, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.2px', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', gap:8 };

export default function AdminAnalytics() {
  usePageTitle('Platform Analytics');
  const { apps,   loading: appsLoading   } = useAdminPharmacies('');
  const { orders, loading: ordersLoading } = useAdminOrders();
  const loading = appsLoading || ordersLoading;

  const stats = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const totalGmv  = delivered.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const avgOrder  = delivered.length > 0 ? totalGmv / delivered.length : 0;

    // Last 7 calendar days
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d       = new Date();
      d.setDate(d.getDate() - i);
      const label   = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      const dateStr = d.toISOString().slice(0, 10);
      const gmv     = delivered
        .filter(o => o.created_at?.slice(0, 10) === dateStr)
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      revenueByDay.push({ day: label, gmv: Math.round(gmv) });
    }

    // Orders by status
    const statusCounts = {};
    orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status]||0) + 1; });
    const ordersByStatus = Object.entries(statusCounts).map(([name,value]) => ({ name, value }));

    // Top medicines across all orders
    const medMap = {};
    delivered.forEach(o => o.items?.forEach(item => {
      const k = item.medicine_name;
      if (!medMap[k]) medMap[k] = { name:k, units:0, revenue:0 };
      medMap[k].units   += item.quantity;
      medMap[k].revenue += Number(item.line_total || 0);
    }));
    const topMeds = Object.values(medMap).sort((a,b) => b.revenue - a.revenue).slice(0,6);

    // Stores by city
    const cityMap = {};
    apps.forEach(a => { cityMap[a.city] = (cityMap[a.city]||0) + 1; });
    const geoData = Object.entries(cityMap)
      .map(([city, stores]) => ({ city, stores, orders: orders.filter(o => o.store?.city === city).length }))
      .sort((a,b) => b.stores - a.stores).slice(0,6);

    return { totalGmv, avgOrder, revenueByDay, ordersByStatus, topMeds, geoData };
  }, [orders, apps]);

  const ordersError = orders.length === 0 && !ordersLoading;

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'var(--sp-4)' }}>
        {[1,2,3,4].map(i => <SkeletonCard key={i} lines={3} />)}
      </div>
      <SkeletonCard lines={8} />
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>Platform Analytics</h1>
        <p style={{ fontSize:13, color:'var(--ink-500)', marginTop:4 }}>Derived from real orders and pharmacy data.</p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'var(--sp-4)' }}>
        {[
          { icon:TrendingUp,  label:'Platform GMV',      val:`₹${stats.totalGmv.toLocaleString('en-IN')}`, color:'var(--green-700)' },
          { icon:ShoppingCart,label:'Total Orders',      val:orders.length,                                 color:'var(--blue-700)' },
          { icon:Store,       label:'Total Stores',      val:apps.length,                                   color:'var(--purple,#7C3AED)' },
          { icon:Store,       label:'Approved Stores',   val:apps.filter(a=>a.status==='approved').length,  color:'var(--success-dark)' },
          { icon:Package,     label:'Avg Order Value',   val:`₹${Math.round(stats.avgOrder)}`,              color:'var(--warning-dark)' },
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

      {/* Backend not implemented notice */}
      {ordersError && (
        <div style={{ background:'var(--warning-light)', border:'1px solid #FDE68A', borderRadius:12, padding:'var(--sp-4)', fontSize:13, color:'#92400E', display:'flex', gap:8 }}>
          <span>⚠</span>
          <span>Order analytics is empty because <code>GET /api/v1/admin/orders</code> is not yet implemented on the backend. Implement it (see BACKEND_FIXES.md #11) and all charts will populate automatically from real data.</span>
        </div>
      )}

      {/* GMV by day */}
      <div style={card}>
        <div style={cardTitle}><TrendingUp size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />GMV by Day of Week</div>
        {stats.revenueByDay.every(d => d.gmv === 0) ? (
          <div style={{ textAlign:'center', padding:'var(--sp-8)', color:'var(--ink-400)', fontSize:14 }}>No delivered orders yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.revenueByDay} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize:12, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false}
                tickFormatter={v => v > 0 ? `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}` : '0'} />
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'GMV']}
                contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              <Bar dataKey="gmv" fill="var(--green-700)" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-5)' }}>
        {/* Top medicines */}
        <div style={card}>
          <div style={cardTitle}><Package size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Top Medicines by Revenue</div>
          {stats.topMeds.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>No data yet.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
              {stats.topMeds.map((med, i) => {
                const maxRev = stats.topMeds[0].revenue;
                return (
                  <div key={med.name}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{med.name}</span>
                      <span style={{ fontSize:12, color:'var(--ink-500)' }}>₹{Number(med.revenue).toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ height:5, background:'var(--ink-100)', borderRadius:9999 }}>
                      <div style={{ height:5, background:PIE_COLORS[i%PIE_COLORS.length], borderRadius:9999, width:`${maxRev>0?(med.revenue/maxRev)*100:0}%`, transition:'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div style={card}>
          <div style={cardTitle}><ShoppingCart size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Orders by Status</div>
          {stats.ordersByStatus.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>No orders yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.ordersByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {stats.ordersByStatus.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Tooltip contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stores by city */}
      {stats.geoData.length > 0 && (
        <div style={card}>
          <div style={cardTitle}><MapPin size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Stores by City</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'var(--sp-3)' }}>
            {stats.geoData.map(({ city, stores }) => (
              <div key={city} style={{ background:'var(--ink-50)', borderRadius:10, padding:'var(--sp-3)', textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:700, color:'var(--green-700)' }}>{stores}</div>
                <div style={{ fontSize:12, color:'var(--ink-500)', marginTop:2 }}>{city}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
