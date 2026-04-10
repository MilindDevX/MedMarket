import usePageTitle from '../../utils/usePageTitle';
import { useMemo } from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import useAuthStore from '../../store/authStore';
import KpiCard from '../../components/ui/KpiCard';
import { usePharmacyOrders } from '../../hooks/usePharmacyOrders';
import { useInventory } from '../../hooks/useInventory';
import styles from './PharmacyDashboard.module.css';

// weekData is derived from real orders inside the component

const statusMeta = {
  confirmed: { label:'New Order',  color:'var(--blue-700)',     bg:'var(--blue-50)' },
  accepted:  { label:'Accepted',   color:'var(--green-700)',    bg:'var(--green-50)' },
  packing:   { label:'Packing',    color:'var(--warning-dark)', bg:'var(--warning-light)' },
  dispatched:{ label:'Dispatched', color:'var(--green-700)',    bg:'var(--green-50)' },
};

export default function PharmacyDashboard() {
  usePageTitle('Pharmacy Dashboard');
  const { user } = useAuthStore();
  const { orders, loading: ordersLoading } = usePharmacyOrders();
  const { inventory, loading: invLoading  } = useInventory();

  const activeOrders = orders.filter(o => !['delivered','rejected','cancelled'].includes(o.status));

  // Last 7 calendar days of revenue
  const weekData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d       = new Date();
      d.setDate(d.getDate() - i);
      const label   = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      const dateStr = d.toISOString().slice(0, 10);
      const revenue = orders
        .filter(o => o.status === 'delivered' && o.created_at?.slice(0, 10) === dateStr)
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      days.push({ day: label, revenue: Math.round(revenue) });
    }
    return days;
  }, [orders]);
  const todayRevenue = orders
    .filter(o => {
      if (o.status !== 'delivered') return false;
      const orderDate = new Date(o.created_at).toDateString();
      const today     = new Date().toDateString();
      return orderDate === today;
    })
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const revenueDisplay = todayRevenue > 0 ? `₹${todayRevenue.toLocaleString('en-IN')}` : '₹0';

  const now = new Date();
  const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const expiryAlerts = inventory.filter(i => i.exp_date && new Date(i.exp_date) <= sixtyDays);
  const totalSKUs = inventory.length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Good morning, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className={styles.subtitle}>Here's what's happening at your store today.</p>
        </div>
        <div className={styles.verifiedBadge}>
          <CheckCircle size={14} strokeWidth={2.5} />
          MedMarket Verified Store
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard label="Revenue Today" value={ordersLoading ? '...' : revenueDisplay} sub="From delivered orders" icon={DollarSign} iconColor="var(--green-700)" index={0} />
        <KpiCard label="Active Orders" value={ordersLoading ? '...' : String(activeOrders.length)} sub={`${activeOrders.filter(o=>o.status==='confirmed').length} awaiting acceptance`} icon={ShoppingBag} iconColor="var(--blue-700)" index={1} />
        <KpiCard label="Expiry Alerts" value={invLoading ? '...' : String(expiryAlerts.length)} sub="Action needed" subColor="var(--danger)" icon={AlertTriangle} iconColor="var(--danger)" index={2} />
        <KpiCard label="Total SKUs" value={invLoading ? '...' : String(totalSKUs)} sub="In inventory" icon={Package} iconColor="var(--purple)" index={3} />
      </div>

      {/* Revenue chart */}
      <div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)', marginBottom:'var(--sp-5)' }}>
        <div className={styles.sectionHeader} style={{ marginBottom:'var(--sp-4)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>Revenue — Last 7 Days</h2>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize:12, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'var(--ink-400)' }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v=>[`₹${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius:8, border:'1px solid var(--ink-200)', fontSize:13 }} />
            <Bar dataKey="revenue" fill="var(--green-700)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>Active Orders</h2>
            <Link to="/pharmacy/orders" style={{ fontSize:13, fontWeight:600, color:'var(--green-700)', textDecoration:'none' }}>View all →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
            {activeOrders.slice(0,5).map(order => {
              const meta = statusMeta[order.status] || statusMeta.confirmed;
              return (
                <div key={order.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--sp-3) var(--sp-4)', background:'var(--ink-50)', borderRadius:10 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)', fontFamily:'monospace' }}>{order.id?.slice(0,12)}...</div>
                    <div style={{ fontSize:12, color:'var(--ink-500)', marginTop:2 }}>{order.consumer?.name}</div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:meta.color, background:meta.bg, padding:'3px 9px', borderRadius:9999 }}>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
