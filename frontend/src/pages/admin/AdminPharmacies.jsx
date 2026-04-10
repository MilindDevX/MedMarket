import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, ShieldOff } from 'lucide-react';
import { useAdminPharmacies } from '../../hooks/useAdminPharmacies';
import Badge from '../../components/ui/Badge';
import { SkeletonTable } from '../../components/ui/Skeleton';
import useToastStore from '../../store/toastStore';
import styles from './AdminPharmacies.module.css';

const statusBadge = { pending:'pending', approved:'approved', rejected:'rejected', suspended:'rejected' };

export default function AdminPharmacies() {
  usePageTitle('Pharmacy Applications');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const toast = useToastStore();
  const { apps, loading, approve, reject, suspend } = useAdminPharmacies(filter === 'all' ? '' : filter);

  const filtered = apps.filter(a => {
    const q = search.toLowerCase();
    return !search || a.name?.toLowerCase().includes(q) || a.owner?.name?.toLowerCase().includes(q);
  });

  const counts = {
    all:       apps.length,
    pending:   apps.filter(a => a.status==='pending').length,
    approved:  apps.filter(a => a.status==='approved').length,
    rejected:  apps.filter(a => a.status==='rejected').length,
    suspended: apps.filter(a => a.status==='suspended').length,
  };

  const handleApprove = async (app) => {
    try { await approve(app.id); toast.success(`${app.name} approved.`); }
    catch (err) { toast.error(err.message); }
  };

  const handleSuspend = async (app) => {
    if (!confirm(`Suspend ${app.name}? They will be hidden from consumers.`)) return;
    try { await suspend(app.id); toast.warning(`${app.name} suspended.`); }
    catch (err) { toast.error(err.message); }
  };

  const _handleReject = async (app) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try { await reject(app.id, reason); toast.warning(`${app.name} rejected.`); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return (
    <div>
      <div className={styles.skeletonHeader}><div className={styles.skeletonTitle} /><div className={styles.skeletonSub} /></div>
      <SkeletonTable rows={5} cols={7} />
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Pharmacy Applications</h1>
        <p className={styles.subtitle}>Review and verify pharmacy store applications</p>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.searchInput} value={search}
            onChange={e => setSearch(e.target.value)} placeholder="Search store or owner name..." />
        </div>
        <div className={styles.tabRow}>
          {Object.entries(counts).map(([key, count]) =>
            count > 0 || key === 'all' ? (
              <button key={key} onClick={() => setFilter(key)}
                className={`${styles.tab} ${filter===key ? styles.tabActive : ''}`}>
                {key.charAt(0).toUpperCase()+key.slice(1)} ({count})
              </button>
            ) : null
          )}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr className={styles.thead}>
            {['Store','Owner','Drug License','Submitted','Status','Actions'].map(h => (
              <th key={h} className={styles.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((app, i) => (
              <motion.tr key={app.id} className={styles.tr}
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.05 }}>
                <td className={styles.td}>
                  <div className={styles.storeName}>{app.name}</div>
                  <div className={styles.storeCity}>{app.city}, {app.state}</div>
                </td>
                <td className={styles.td}><span className={styles.owner}>{app.owner?.name}</span></td>
                <td className={styles.td}><span className={styles.license}>{app.drug_license_no}</span></td>
                <td className={styles.td}><span className={styles.date}>{new Date(app.created_at).toLocaleDateString('en-IN')}</span></td>
                <td className={styles.td}>
                  <Badge variant={statusBadge[app.status] || 'default'}>
                    {app.status?.charAt(0).toUpperCase()+app.status?.slice(1)}
                  </Badge>
                </td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    <Link to={`/admin/pharmacies/${app.id}`} className={styles.reviewBtn}>
                      {app.status==='pending' ? 'Review' : 'View'}
                    </Link>
                    {app.status==='pending' && (
                      <>
                        <button className={styles.reinstateBtn} onClick={() => handleApprove(app)}>Approve</button>
                        <button className={styles.suspendBtn} onClick={() => handleSuspend(app)}>Suspend</button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className={styles.empty}>No pharmacies match your filters.</div>}
      </div>
    </div>
  );
}
