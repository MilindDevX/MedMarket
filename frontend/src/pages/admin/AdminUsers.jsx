import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, UserX, UserCheck, Users } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import useToastStore from '../../store/toastStore';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { SkeletonTable } from '../../components/ui/Skeleton';

export default function AdminUsers() {
  usePageTitle('User Management');

  const { users, loading, error, toggleActive } = useAdminUsers();
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const toast = useToastStore();

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(q) ||
      u.mobile?.includes(q) ||
      u.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active' ? u.is_active : !u.is_active);
    return matchSearch && matchStatus;
  });

  const handleToggle = async (u) => {
    try {
      await toggleActive(u.id, u.is_active);
      toast[!u.is_active ? 'success' : 'warning'](
        `${u.name}'s account ${!u.is_active ? 'reactivated' : 'deactivated'}.`
      );
    } catch {
      // Backend endpoint may not exist yet — show informative message
      toast.error('User management API not yet implemented. Add GET/PATCH /admin/users to the backend.');
    }
  };

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div style={{ width:200, height:26, background:'var(--ink-100)', borderRadius:8 }} />
      <SkeletonTable rows={5} cols={6} />
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px' }}>
          User Management
        </h1>
        <p style={{ fontSize:13, color:'var(--ink-500)', marginTop:4 }}>
          {users.length} registered users · {users.filter(u => u.is_active !== false).length} active
        </p>
      </div>

      {/* API not implemented notice */}
      {error && (
        <div style={{ background:'var(--warning-light)', border:'1px solid #FDE68A', borderRadius:10, padding:'var(--sp-3) var(--sp-4)', fontSize:13, color:'#92400E', display:'flex', gap:8, alignItems:'flex-start' }}>
          <span style={{ fontWeight:700 }}>⚠</span>
          <span>Backend endpoint <code>GET /api/v1/admin/users</code> not yet implemented. Add it to see real users here. Error: {error}</span>
        </div>
      )}

      <div style={{ display:'flex', gap:'var(--sp-3)', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={15} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--ink-400)', pointerEvents:'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, mobile, email..."
            style={{ width:'100%', height:40, paddingLeft:34, border:'1.5px solid var(--ink-200)', borderRadius:'var(--r-md)', fontSize:14, fontFamily:'var(--font-body)', outline:'none', background:'var(--white)', boxSizing:'border-box' }} />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'var(--ink-400)', display:'flex', background:'none', border:'none', cursor:'pointer', padding:2 }}>
              <X size={13}/>
            </button>
          )}
        </div>
        {['all','active','inactive'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ padding:'8px 16px', borderRadius:'var(--r-md)', fontSize:13, fontWeight:600, cursor:'pointer', border:'1.5px solid', borderColor: statusFilter===s ? 'var(--ink-900)' : 'var(--ink-200)', background: statusFilter===s ? 'var(--ink-900)' : 'var(--white)', color: statusFilter===s ? 'var(--white)' : 'var(--ink-500)', textTransform:'capitalize', transition:'all 0.15s', fontFamily:'var(--font-body)' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Empty state when API not implemented */}
      {users.length === 0 && !loading && (
        <div style={{ textAlign:'center', padding:'var(--sp-12)', color:'var(--ink-400)', background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16 }}>
          <Users size={40} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)' }} />
          <p style={{ fontSize:15, fontWeight:600, color:'var(--ink-700)', marginBottom:8 }}>No users found</p>
          <p style={{ fontSize:13 }}>
            To show real users, add these endpoints to your backend:
          </p>
          <code style={{ display:'block', marginTop:8, fontSize:12, background:'var(--ink-50)', padding:'var(--sp-3)', borderRadius:8, color:'var(--ink-700)' }}>
            GET  /api/v1/admin/users<br/>
            PATCH /api/v1/admin/users/:id/toggle
          </code>
        </div>
      )}

      {/* Users table */}
      {users.length > 0 && (
        <div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--always-dark)' }}>
                {['User','Mobile','City','Orders','Joined','Status','Action'].map(h => (
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--always-sub)', textTransform:'uppercase', letterSpacing:'0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <motion.tr key={user.id}
                  style={{ borderBottom:'1px solid var(--ink-100)', opacity: user.is_active !== false ? 1 : 0.6 }}
                  initial={{ opacity:0 }} animate={{ opacity: user.is_active !== false ? 1 : 0.6 }}
                  transition={{ delay:i*0.05 }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--ink-50)'}
                  onMouseLeave={e => e.currentTarget.style.background=''}>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background: user.is_active !== false ? 'var(--green-700)' : 'var(--ink-300)', color:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
                        {user.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-900)' }}>{user.name}</div>
                        <div style={{ fontSize:11, color:'var(--ink-400)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'14px 16px', fontSize:13, color:'var(--ink-700)', fontFamily:'monospace' }}>{user.mobile}</td>
                  <td style={{ padding:'14px 16px', fontSize:13, color:'var(--ink-500)' }}>{user.city || '—'}</td>
                  <td style={{ padding:'14px 16px', fontSize:14, fontWeight:700, color:'var(--ink-900)' }}>{user._count?.orders ?? '—'}</td>
                  <td style={{ padding:'14px 16px', fontSize:12, color:'var(--ink-400)' }}>
                    {new Date(user.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <Badge variant={user.is_active !== false ? 'verified' : 'rejected'} dot>
                      {user.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <button onClick={() => handleToggle(user)}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background: user.is_active !== false ? 'var(--danger-light)' : 'var(--success-light)', color: user.is_active !== false ? '#991B1B' : '#065F46', border:`1px solid ${user.is_active !== false ? '#FECACA' : '#6EE7B7'}`, borderRadius:'var(--r-sm)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.15s' }}>
                      {user.is_active !== false
                        ? <><UserX size={13} strokeWidth={2}/> Deactivate</>
                        : <><UserCheck size={13} strokeWidth={2}/> Reactivate</>}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
