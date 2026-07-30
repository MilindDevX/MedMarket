import usePageTitle from '../../utils/usePageTitle';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Store, ShoppingCart, Users, Clock, CheckCircle, ChevronUp, ChevronDown, ChevronsUpDown, MapPin } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
  AreaChart, Area, LineChart, Line
} from 'recharts';
import { useAdminPlatformAnalytics } from '../../hooks/useAdminPlatformAnalytics';
import { SkeletonCard } from '../../components/ui/Skeleton';

const fmtMoney = (v) => {
  const n = Number(v);
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
};
const fmtAxis = v => {
  if (v >= 100000) return `₹${(v/100000).toFixed(0)}L`;
  if (v >= 1000)   return `₹${(v/1000).toFixed(0)}k`;
  return `₹${v}`;
};
const PIE_COLORS = ['#0C6B4E','#1A56DB','#8B5CF6','#F59E0B','#10B981','#EF4444'];
const card      = { background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' };
const cardTitle = { fontSize:16, fontWeight:700, color:'var(--ink-900)', letterSpacing:'-0.2px', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', gap:8 };

export default function AdminAnalytics() {
  usePageTitle('Platform Analytics');
  const { data, loading, error } = useAdminPlatformAnalytics();

  const [activeTab, setActiveTab] = useState('overview');  // 'overview' | 'breakdown'
  const [sortKey,   setSortKey]   = useState('orders');
  const [sortDir,   setSortDir]   = useState('desc');

  // Destructure from API response with safe defaults
  const {
    totalGmv        = 0,
    totalOrders     = 0,
    fulfillmentRate = 0,
    rejectionRate   = 0,
    approvedStores  = 0,
    pendingStores   = 0,
    avgTurnaround   = 0,
    activationRate  = 0,
    gmvByDay        = [],
    regByDay        = [],
    topMedicines    = [],
    storeStatusDist = [],
    pharmacyRows    = [],
  } = data ?? {};

  // City ranking derived from pharmacyRows (already has city + orders)
  const cityRanking = useMemo(() => {
    const cityMap = {};
    pharmacyRows.forEach(r => {
      if (!cityMap[r.city]) cityMap[r.city] = { city: r.city, orders: 0, gmv: 0 };
      cityMap[r.city].orders += r.orders;
      cityMap[r.city].gmv    += r.gmv;
    });
    return Object.values(cityMap).sort((a, b) => b.orders - a.orders).slice(0, 8);
  }, [pharmacyRows]);

  // Sort pharmacy breakdown table
  const sortedRows = useMemo(() => {
    return [...pharmacyRows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [pharmacyRows, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronsUpDown size={12} style={{ color:'var(--ink-300)', marginLeft:3 }} />;
    return sortDir === 'asc'
      ? <ChevronUp   size={12} style={{ color:'var(--green-700)', marginLeft:3 }} />
      : <ChevronDown size={12} style={{ color:'var(--green-700)', marginLeft:3 }} />;
  };

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'var(--sp-4)' }}>
        {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} lines={3} />)}
      </div>
      <SkeletonCard lines={8} /><SkeletonCard lines={6} />
    </div>
  );

  if (error) return (
    <div style={{ textAlign:'center', padding:'var(--sp-12)', color:'var(--danger)' }}>
      <CheckCircle size={32} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)', display:'block', color:'var(--ink-300)' }} />
      <p style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>Failed to load analytics</p>
      <p style={{ fontSize:13, color:'var(--ink-400)' }}>{error}</p>
    </div>
  );


  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'var(--sp-3)' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>Platform Analytics</h1>
          <p style={{ fontSize:13, color:'var(--ink-500)', marginTop:4 }}>Live platform-wide metrics across all stores and consumers.</p>
        </div>
        {/* ── Tab Switcher ── */}
        <div style={{ display:'flex', background:'var(--ink-100)', borderRadius:10, padding:3, gap:3 }}>
          {[
            { id:'overview',   label:'Platform Overview' },
            { id:'breakdown',  label:'Pharmacy Breakdown' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ padding:'7px 18px', borderRadius:8, fontSize:13, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.15s',
                background: activeTab === id ? 'var(--white)'     : 'transparent',
                color:      activeTab === id ? 'var(--ink-900)'   : 'var(--ink-500)',
                boxShadow:  activeTab === id ? 'var(--shadow-sm)' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (<>
      {/* ── KPIs ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'var(--sp-4)' }}>
        {[
          { icon:TrendingUp,    label:'Total GMV',             val:fmtMoney(totalGmv),           color:'var(--green-700)' },
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
              tickFormatter={fmtAxis} />
            <Tooltip formatter={v => [fmtMoney(v), 'GMV']}
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
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--ink-200)' }}>
                    {['#','City','Orders','GMV','Share'].map(h => (
                      <th key={h} style={{ textAlign: h==='#'||h==='Orders'||h==='GMV'||h==='Share' ? 'right' : 'left', padding:'6px 8px', fontWeight:700, color:'var(--ink-400)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cityRanking.map((c, i) => {
                    const maxOrders = cityRanking[0].orders;
                    const shareWidth = maxOrders > 0 ? Math.round((c.orders / cityRanking.reduce((s,x) => s+x.orders, 0)) * 100) : 0;
                    return (
                      <tr key={c.city} style={{ borderBottom:'1px solid var(--ink-100)' }}>
                        <td style={{ padding:'10px 8px', textAlign:'right', color:'var(--ink-400)', fontWeight:700, fontSize:12, width:28 }}>{i+1}</td>
                        <td style={{ padding:'10px 8px', fontWeight:600, color:'var(--ink-900)' }}>{c.city}</td>
                        <td style={{ padding:'10px 8px', textAlign:'right', fontWeight:600, color:'var(--ink-700)' }}>{c.orders}</td>
                        <td style={{ padding:'10px 8px', textAlign:'right', fontWeight:600, color:'var(--green-700)' }}>{fmtMoney(c.gmv)}</td>
                        <td style={{ padding:'10px 8px', textAlign:'right', minWidth:80 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                            <div style={{ flex:1, height:6, background:'var(--ink-100)', borderRadius:9999, maxWidth:60 }}>
                              <div style={{ height:6, background:PIE_COLORS[i % PIE_COLORS.length], borderRadius:9999, width:`${shareWidth}%` }} />
                            </div>
                            <span style={{ fontSize:11, color:'var(--ink-500)', width:28, textAlign:'right' }}>{shareWidth}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
      </>)}

      {/* ── Pharmacy Breakdown Tab ── */}
      {activeTab === 'breakdown' && (
        <div style={card}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Store size={17} strokeWidth={1.8} style={{ color:'var(--blue-700)' }} />
              <span style={{ fontSize:16, fontWeight:700, color:'var(--ink-900)' }}>
                All Approved Stores ({sortedRows.length})
              </span>
            </div>
            <span style={{ fontSize:12, color:'var(--ink-400)' }}>Click column headers to sort</span>
          </div>

          {sortedRows.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)', fontSize:14 }}>
              No approved stores yet.
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--ink-200)', background:'var(--ink-50)' }}>
                    {[
                      { key:'name',        label:'Store Name',      align:'left'  },
                      { key:'city',        label:'City',            align:'left'  },
                      { key:'orders',      label:'Orders',          align:'right' },
                      { key:'gmv',         label:'GMV',             align:'right' },
                      { key:'fulfillRate', label:'Fulfillment %',   align:'right' },
                      { key:'avgOrderVal', label:'Avg Order Value', align:'right' },
                      { key:'lastActive',  label:'Last Active',     align:'right' },
                    ].map(({ key, label, align }) => (
                      <th key={key} onClick={() => handleSort(key)}
                        style={{ padding:'10px 12px', textAlign:align, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', color: sortKey===key ? 'var(--green-700)' : 'var(--ink-400)', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
                        <span style={{ display:'inline-flex', alignItems:'center' }}>
                          {label}<SortIcon col={key} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, i) => (
                    <motion.tr key={row.id}
                      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                      style={{ borderBottom:'1px solid var(--ink-100)', transition:'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--ink-50)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'12px 12px', fontWeight:600, color:'var(--ink-900)', maxWidth:200 }}>
                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.name}</div>
                      </td>
                      <td style={{ padding:'12px 12px', color:'var(--ink-600)' }}>{row.city}</td>
                      <td style={{ padding:'12px 12px', textAlign:'right', fontWeight:700, color:'var(--blue-700)' }}>{row.orders}</td>
                      <td style={{ padding:'12px 12px', textAlign:'right', fontWeight:700, color:'var(--green-700)' }}>{fmtMoney(row.gmv)}</td>
                      <td style={{ padding:'12px 12px', textAlign:'right' }}>
                        {row.orders === 0 ? <span style={{ color:'var(--ink-300)' }}>—</span> : (
                          <span style={{
                            fontWeight:700, fontSize:12, padding:'3px 9px', borderRadius:9999,
                            color:      row.fulfillRate >= 80 ? 'var(--success-dark)'  : row.fulfillRate >= 50 ? 'var(--warning-dark)' : 'var(--danger)',
                            background: row.fulfillRate >= 80 ? 'var(--success-light)' : row.fulfillRate >= 50 ? 'var(--warning-light)' : 'var(--danger-light)',
                          }}>
                            {row.fulfillRate}%
                          </span>
                        )}
                      </td>
                      <td style={{ padding:'12px 12px', textAlign:'right', color:'var(--ink-700)', fontWeight:600 }}>
                        {row.orders === 0 ? <span style={{ color:'var(--ink-300)' }}>—</span> : fmtMoney(row.avgOrderVal)}
                      </td>
                      <td style={{ padding:'12px 12px', textAlign:'right', color:'var(--ink-500)', fontSize:12 }}>
                        {row.lastActive
                          ? new Date(row.lastActive).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                          : <span style={{ color:'var(--ink-300)' }}>No orders</span>}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

