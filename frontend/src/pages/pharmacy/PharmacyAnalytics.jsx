import usePageTitle from '../../utils/usePageTitle';
import { useMemo } from 'react';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart2, Package, ShoppingBag, Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { usePharmacyOrders } from '../../hooks/usePharmacyOrders';
import { useInventory } from '../../hooks/useInventory';

const PIE_COLORS = ['#0C6B4E','#1A56DB','#8B5CF6','#F59E0B','#10B981','#EF4444'];
const card      = { background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' };
const cardTitle = { fontSize:16, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.2px', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', gap:8 };

const fmt = v => v >= 1000 ? `₹${(v/1000).toFixed(1)}k` : `₹${v}`;

export default function PharmacyAnalytics() {
  usePageTitle('Analytics');
  const { orders,    loading: ordersLoading } = usePharmacyOrders();
  const { inventory, loading: invLoading }    = useInventory();
  const loading = ordersLoading || invLoading;

  const metrics = useMemo(() => {
    const delivered  = orders.filter(o => o.status === 'delivered');
    const rejected   = orders.filter(o => o.status === 'rejected');
    const cancelled  = orders.filter(o => o.status === 'cancelled');
    const totalRev   = delivered.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const avgVal     = delivered.length > 0 ? totalRev / delivered.length : 0;

    // Fulfillment & rejection rates
    const terminal        = delivered.length + rejected.length + cancelled.length;
    const fulfillmentRate = terminal > 0 ? Math.round((delivered.length / terminal) * 100) : 0;
    const rejectionRate   = terminal > 0 ? Math.round((rejected.length  / terminal) * 100) : 0;

    // Repeat vs new customers
    const customerOrderCount = {};
    orders.forEach(o => {
      customerOrderCount[o.consumer_id] = (customerOrderCount[o.consumer_id] || 0) + 1;
    });
    const repeatCustomers = Object.values(customerOrderCount).filter(n => n > 1).length;
    const totalCustomers  = Object.keys(customerOrderCount).length;
    const repeatRate      = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    // Last 14 days revenue trend
    const revenueByDay = [];
    for (let i = 13; i >= 0; i--) {
      const d       = new Date();
      d.setDate(d.getDate() - i);
      const label   = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      const dateStr = d.toISOString().slice(0, 10);
      const revenue = delivered
        .filter(o => o.created_at?.slice(0, 10) === dateStr)
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      revenueByDay.push({ day: label, revenue: Math.round(revenue) });
    }

    // Hourly order heatmap (0-23)
    const hourBuckets = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, orders: 0 }));
    orders.forEach(o => {
      const h = new Date(o.created_at).getHours();
      hourBuckets[h].orders += 1;
    });

    // Top medicines
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
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // Category pie from inventory
    const catMap = {};
    inventory.forEach(inv => {
      const cat = inv.medicine?.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + inv.quantity;
    });
    const catTotal = Object.values(catMap).reduce((s, v) => s + v, 0) || 1;
    const categoryShare = Object.entries(catMap)
      .map(([name, val]) => ({ name, value: Math.round(val / catTotal * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Dead stock value at risk (no sales in last 45 days, status active)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 45);
    const soldInventoryIds = new Set(
      delivered.flatMap(o => o.items?.map(i => i.inventory_id) || [])
    );
    const deadStockItems = inventory.filter(inv =>
      inv.status === 'active' &&
      inv.quantity > 0 &&
      !soldInventoryIds.has(inv.id)
    );
    const deadStockValue = deadStockItems.reduce(
      (s, inv) => s + Number(inv.selling_price) * inv.quantity, 0
    );

    // Order status distribution pie
    const statusDist = [
      { name: 'Delivered',  value: delivered.length,  fill: '#0C6B4E' },
      { name: 'Rejected',   value: rejected.length,   fill: '#EF4444' },
      { name: 'Cancelled',  value: cancelled.length,  fill: '#F59E0B' },
      { name: 'Active',     value: orders.filter(o => !['delivered','rejected','cancelled'].includes(o.status)).length, fill: '#1A56DB' },
    ].filter(d => d.value > 0);

    return {
      totalRevenue: totalRev, totalOrders: orders.length, deliveredOrders: delivered.length,
      avgOrderValue: avgVal, fulfillmentRate, rejectionRate,
      repeatRate, totalCustomers,
      revenueByDay, hourBuckets, topMedicines, categoryShare,
      deadStockItems: deadStockItems.length, deadStockValue,
      statusDist,
    };
  }, [orders, inventory]);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'var(--sp-4)' }}>
        {[1,2,3,4].map(i => <SkeletonCard key={i} lines={3} />)}
      </div>
      <SkeletonCard lines={8} /><SkeletonCard lines={6} />
    </div>
  );

  const { totalRevenue, totalOrders, deliveredOrders, avgOrderValue,
    fulfillmentRate, rejectionRate, repeatRate, totalCustomers: _totalCustomers,
    revenueByDay, hourBuckets, topMedicines, categoryShare,
    deadStockItems, deadStockValue, statusDist } = metrics;

  const noData = deliveredOrders === 0 && totalOrders === 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>Analytics</h1>
        <p style={{ fontSize:13, color:'var(--ink-500)', marginTop:4 }}>Based on your real order and inventory data.</p>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:'var(--sp-4)' }}>
        {[
          { icon:TrendingUp,    label:'Total Revenue',       val:`₹${totalRevenue.toLocaleString('en-IN')}`,     color:'var(--green-700)' },
          { icon:ShoppingBag,   label:'Total Orders',        val:totalOrders,                                    color:'var(--blue-700)' },
          { icon:CheckCircle,   label:'Fulfillment Rate',    val:`${fulfillmentRate}%`,                          color:'var(--success-dark)' },
          { icon:BarChart2,     label:'Avg Order Value',     val:`₹${Math.round(avgOrderValue)}`,                color:'#7C3AED' },
          { icon:Users,         label:'Repeat Customer %',   val:`${repeatRate}%`,                              color:'var(--blue-700)' },
          { icon:AlertTriangle, label:'Dead Stock Value',    val:`₹${Math.round(deadStockValue).toLocaleString('en-IN')}`, color:'var(--warning-dark)' },
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

      {noData && (
        <div style={{ ...card, textAlign:'center', padding:'var(--sp-10)' }}>
          <BarChart2 size={40} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)', color:'var(--ink-300)' }} />
          <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:8 }}>No analytics data yet</p>
          <p style={{ fontSize:13, color:'var(--ink-400)' }}>Analytics populate as orders are placed and delivered through your store.</p>
        </div>
      )}

      {/* ── Revenue Trend — 14 days ── */}
      <div style={card}>
        <div style={cardTitle}>
          <TrendingUp size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
          Revenue — Last 14 Days
        </div>
        {deliveredOrders === 0 ? (
          <div style={{ textAlign:'center', padding:'var(--sp-8)', color:'var(--ink-400)', fontSize:14 }}>No delivered orders yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByDay}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0C6B4E" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0C6B4E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false}
                interval={Math.ceil(revenueByDay.length / 7) - 1} />
              <YAxis tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              <Area type="monotone" dataKey="revenue" stroke="#0C6B4E" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Top Medicines + Order Status ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-5)' }}>
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
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--ink-900)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'55%' }}>{med.name}</span>
                      <span style={{ fontSize:12, color:'var(--ink-500)', flexShrink:0 }}>₹{Math.round(med.revenue).toLocaleString('en-IN')} · {med.units}u</span>
                    </div>
                    <div style={{ height:5, background:'var(--ink-100)', borderRadius:9999 }}>
                      <div style={{ height:5, background: PIE_COLORS[i % PIE_COLORS.length], borderRadius:9999, width:`${maxRev > 0 ? (med.revenue/maxRev)*100 : 0}%`, transition:'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={cardTitle}><BarChart2 size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Order Status Breakdown</div>
          {statusDist.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>No orders yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={48} outerRadius={75}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {statusDist.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
                <Tooltip formatter={(v, n) => [v, n]}
                  contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Hourly Order Heatmap ── */}
      <div style={card}>
        <div style={cardTitle}>
          <Clock size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
          Orders by Hour of Day
          <span style={{ fontSize:12, fontWeight:400, color:'var(--ink-400)', marginLeft:4 }}>— helps with staffing decisions</span>
        </div>
        {totalOrders === 0 ? (
          <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>No orders yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourBuckets.filter((_, i) => i >= 7 && i <= 22)} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize:10, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip formatter={v => [v, 'Orders']}
                contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              <Bar dataKey="orders" fill="#1A56DB" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Inventory by Category + Fulfillment/Rejection ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-5)' }}>
        <div style={card}>
          <div style={cardTitle}><Package size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Inventory by Category</div>
          {categoryShare.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-6)', color:'var(--ink-400)', fontSize:14 }}>No inventory yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryShare} cx="50%" cy="50%" innerRadius={50} outerRadius={78}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {categoryShare.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Tooltip formatter={v => [`${v}%`, 'Share']}
                  contentStyle={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:8, fontSize:13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={card}>
          <div style={cardTitle}><Users size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />Performance Summary</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
            {[
              { label:'Fulfillment Rate',  val:fulfillmentRate, color:'var(--success-dark)', bg:'var(--success-light)', help:'% of completed orders vs rejected+cancelled' },
              { label:'Rejection Rate',    val:rejectionRate,   color:'var(--danger-dark)',  bg:'var(--danger-light)',  help:'% of orders rejected by your store' },
              { label:'Repeat Customers', val:repeatRate,      color:'var(--blue-700)',      bg:'var(--blue-50)',       help:'% of your customers who reordered' },
            ].map(({ label, val, color, bg, help }) => (
              <div key={label}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{label}</div>
                    <div style={{ fontSize:11, color:'var(--ink-400)' }}>{help}</div>
                  </div>
                  <span style={{ fontSize:20, fontWeight:700, color, background:bg, padding:'3px 12px', borderRadius:9999 }}>{val}%</span>
                </div>
                <div style={{ height:5, background:'var(--ink-100)', borderRadius:9999 }}>
                  <div style={{ height:5, background:color, borderRadius:9999, width:`${val}%`, transition:'width 0.6s ease' }} />
                </div>
              </div>
            ))}

            {deadStockItems > 0 && (
              <div style={{ marginTop:'var(--sp-2)', background:'var(--warning-light)', border:'1px solid #FDE68A', borderRadius:10, padding:'var(--sp-3) var(--sp-4)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--warning-dark)' }}>⚠️ Dead Stock Alert</div>
                <div style={{ fontSize:12, color:'var(--warning-dark)', marginTop:3 }}>
                  {deadStockItems} SKU{deadStockItems !== 1 ? 's' : ''} with no sales in 45+ days — ₹{Math.round(deadStockValue).toLocaleString('en-IN')} at risk
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
