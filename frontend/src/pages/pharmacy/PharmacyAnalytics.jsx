import usePageTitle from '../../utils/usePageTitle';
import { useMemo } from 'react';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart2, Package, ShoppingBag } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { usePharmacyOrders } from '../../hooks/usePharmacyOrders';
import { useInventory } from '../../hooks/useInventory';

const PIE_COLORS = ['#0C6B4E','#1A56DB','#8B5CF6','#F59E0B','#10B981','#EF4444'];
const card = { background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' };
const cardTitle = { fontSize:16, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.2px', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', gap:8 };

export default function PharmacyAnalytics() {
  usePageTitle('Analytics');
  const { orders,    loading: ordersLoading } = usePharmacyOrders();
  const { inventory, loading: invLoading }    = useInventory();
  const loading = ordersLoading || invLoading;

  const {
    totalRevenue, totalOrders, deliveredOrders, avgOrderValue,
    revenueByDay, topMedicines, categoryShare,
  } = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const totalRev  = delivered.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const avgVal    = delivered.length > 0 ? totalRev / delivered.length : 0;

    // Last 7 calendar days of revenue (not day-of-week buckets)
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d       = new Date();
      d.setDate(d.getDate() - i);
      const label   = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      const dateStr = d.toISOString().slice(0, 10);
      const revenue = delivered
        .filter(o => o.created_at?.slice(0, 10) === dateStr)
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      revenueByDay.push({ day: label, revenue: Math.round(revenue) });
    }

    // Top medicines from order items
    const medMap = {};
    delivered.forEach(o => {
      o.items?.forEach(item => {
        const key = item.medicine_name;
        if (!medMap[key]) medMap[key] = { name:key, units:0, revenue:0 };
        medMap[key].units   += item.quantity;
        medMap[key].revenue += Number(item.line_total || 0);
      });
    });
    const topMedicines = Object.values(medMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Category share from inventory
    const catMap = {};
    inventory.forEach(inv => {
      const cat = inv.medicine?.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + inv.quantity;
    });
    const total = Object.values(catMap).reduce((s, v) => s + v, 0) || 1;
    const categoryShare = Object.entries(catMap)
      .map(([name, val]) => ({ name, value: Math.round(val / total * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      totalRevenue: totalRev,
      totalOrders: orders.length,
      deliveredOrders: delivered.length,
      avgOrderValue: avgVal,
      revenueByDay,
      topMedicines,
      categoryShare,
    };
  }, [orders, inventory]);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'var(--sp-4)' }}>
        {[1,2,3,4].map(i => <SkeletonCard key={i} lines={3} />)}
      </div>
      <SkeletonCard lines={8} />
      <SkeletonCard lines={6} />
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>Analytics</h1>
        <p style={{ fontSize:13, color:'var(--ink-500)', marginTop:4 }}>Based on your real order and inventory data.</p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'var(--sp-4)' }}>
        {[
          { icon:TrendingUp,  label:'Total Revenue',    val:`₹${totalRevenue.toLocaleString('en-IN')}`, color:'var(--green-700)' },
          { icon:ShoppingBag, label:'Total Orders',     val:totalOrders,                                color:'var(--blue-700)' },
          { icon:ShoppingBag, label:'Delivered',        val:deliveredOrders,                            color:'var(--success-dark)' },
          { icon:BarChart2,   label:'Avg Order Value',  val:`₹${Math.round(avgOrderValue)}`,            color:'var(--purple, #7C3AED)' },
          { icon:Package,     label:'SKUs in Stock',    val:inventory.length,                           color:'var(--warning-dark)' },
        ].map(({ icon:Icon, label, val, color }, i) => (
          <motion.div key={label} style={card}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-2)' }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--ink-400)' }}>{label}</div>
              <div style={{ width:30, height:30, borderRadius:8, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={14} strokeWidth={1.8} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize:26, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.5px' }}>{val}</div>
          </motion.div>
        ))}
      </div>

      {/* Revenue by Day */}
      <div style={card}>
        <div style={cardTitle}><BarChart2 size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Revenue by Day of Week</div>
        {deliveredOrders === 0 ? (
          <div style={{ textAlign:'center', padding:'var(--sp-8)', color:'var(--ink-400)', fontSize:14 }}>No delivered orders yet. Revenue chart will appear here.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByDay} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize:12, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `₹${v/1000 >= 1 ? (v/1000).toFixed(1)+'k' : v}` : '0'} />
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              <Bar dataKey="revenue" fill="var(--green-700)" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-5)' }}>
        {/* Top Medicines */}
        <div style={card}>
          <div style={cardTitle}><TrendingUp size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Top Medicines by Revenue</div>
          {topMedicines.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>No delivered orders yet.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
              {topMedicines.map((med, i) => {
                const maxRev = topMedicines[0].revenue;
                return (
                  <div key={med.name}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{med.name}</span>
                      <span style={{ fontSize:13, color:'var(--ink-500)' }}>₹{Number(med.revenue).toLocaleString('en-IN')} · {med.units} units</span>
                    </div>
                    <div style={{ height:6, background:'var(--ink-100)', borderRadius:9999 }}>
                      <div style={{ height:6, background:`hsl(${160 - i*20},60%,${40 + i*5}%)`, borderRadius:9999, width:`${maxRev > 0 ? (med.revenue/maxRev)*100 : 0}%`, transition:'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category share */}
        <div style={card}>
          <div style={cardTitle}><Package size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Inventory by Category</div>
          {categoryShare.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>No inventory data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryShare} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {categoryShare.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
                <Tooltip formatter={v => [`${v}%`, 'Share']}
                  contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Empty state hint */}
      {deliveredOrders === 0 && topMedicines.length === 0 && (
        <div style={{ ...card, textAlign:'center', padding:'var(--sp-8)', color:'var(--ink-400)' }}>
          <BarChart2 size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)' }} />
          <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:8 }}>No analytics data yet</p>
          <p style={{ fontSize:13 }}>Analytics will populate automatically as orders are placed and delivered through your store.</p>
        </div>
      )}
    </div>
  );
}
