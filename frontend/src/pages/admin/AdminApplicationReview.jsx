import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, AlertTriangle, ArrowLeft,
  Phone, Mail, MapPin, ShieldCheck, FileText, User, Download
} from 'lucide-react';
import { useAdminPharmacies } from '../../hooks/useAdminPharmacies';
import { api } from '../../utils/api';
import useToastStore from '../../store/toastStore';
import { SkeletonCard } from '../../components/ui/Skeleton';

const verifyChecks = [
  { id:'dl',      label:'Drug License (Form 20/21) — valid and not expired' },
  { id:'gst',     label:'GST Certificate — active, matches store state' },
  { id:'aadhaar', label:'Owner Aadhaar — name matches Drug License' },
  { id:'photos',  label:'Store photos — interior, exterior, signboard visible' },
  { id:'address', label:'Address on documents matches registered address' },
];

const Info = ({ label, value }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
    <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--ink-400)' }}>{label}</span>
    <span style={{ fontSize:14, color:'var(--ink-800)', fontWeight:500 }}>{value || '—'}</span>
  </div>
);

export default function AdminApplicationReview() {
  usePageTitle('Application Review');
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToastStore();
  const { apps, loading, approve, reject } = useAdminPharmacies(null);
  const app = apps.find(a => a.id === id);

  const [checked,       setChecked]       = useState({});
  const [rejectReason,  setRejectReason]  = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [submitting,    setSubmitting]    = useState(false);

  const allChecked = verifyChecks.every(c => checked[c.id]);
  const toggle     = (cid) => setChecked(p => ({ ...p, [cid]: !p[cid] }));

  const handleApprove = async () => {
    if (!allChecked) { toast.error('Complete all verification checks before approving.'); return; }
    setSubmitting(true);
    try   { await approve(id); toast.success(`${app.name} approved.`); navigate('/admin/pharmacies'); }
    catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Rejection reason is required.'); return; }
    setSubmitting(true);
    try   { await reject(id, rejectReason); toast.warning(`${app.name} rejected.`); navigate('/admin/pharmacies'); }
    catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleSuspend = async () => {
    if (!window.confirm(`Suspend ${app.name}? They will be hidden from consumers.`)) return;
    setSubmitting(true);
    try   { await api.patch(`/admin/applications/${id}/suspend`, {}); toast.warning(`${app.name} suspended.`); navigate('/admin/pharmacies'); }
    catch (err) { toast.error(err.message || 'Failed to suspend.'); }
    finally { setSubmitting(false); }
  };

  const handleReactivate = async () => {
    setSubmitting(true);
    try   { await api.patch(`/admin/applications/${id}/approve`, {}); toast.success(`${app.name} reactivated.`); navigate('/admin/pharmacies'); }
    catch (err) { toast.error(err.message || 'Failed to reactivate.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ maxWidth:1000, margin:'0 auto' }}><SkeletonCard lines={12} /></div>
  );

  if (!app) return (
    <div style={{ textAlign:'center', padding:'var(--sp-10)', color:'var(--ink-400)' }}>
      <AlertTriangle size={36} strokeWidth={1} style={{ margin:'0 auto var(--sp-3)' }} />
      <p>Application not found.</p>
      <button onClick={() => navigate('/admin/pharmacies')}
        style={{ marginTop:'var(--sp-4)', padding:'10px 20px', background:'var(--green-700)', color:'#FFFFFF', border:'none', borderRadius:'var(--r-md)', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
        Back to Applications
      </button>
    </div>
  );

  const statusColor = { pending:'var(--warning-dark)', approved:'var(--success-dark)', rejected:'var(--danger)', suspended:'var(--warning-dark)' };
  const statusBg    = { pending:'var(--warning-light)', approved:'var(--success-light)', rejected:'var(--danger-light)', suspended:'var(--warning-light)' };

  return (
    <div style={{ maxWidth:1000 }}>
      {/* Back */}
      <button onClick={() => navigate('/admin/pharmacies')}
        style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'var(--ink-500)', background:'none', border:'none', cursor:'pointer', padding:0, marginBottom:'var(--sp-5)', fontFamily:'var(--font-body)' }}>
        <ArrowLeft size={15} strokeWidth={2} /> Back to Applications
      </button>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'var(--sp-3)', marginBottom:'var(--sp-5)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'var(--always-dark)', color:'var(--always-white)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, flexShrink:0 }}>
            {app.name?.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, color:'var(--ink-900)', letterSpacing:'-0.3px', marginBottom:4 }}>
              {app.name}
            </h1>
            <span style={{ fontSize:12, fontWeight:700, padding:'2px 10px', borderRadius:9999, color: statusColor[app.status], background: statusBg[app.status] }}>
              {app.status?.toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{ fontSize:12, color:'var(--ink-400)' }}>
          Submitted {new Date(app.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:'var(--sp-5)', alignItems:'start' }}>
        {/* Left — details */}
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>

          {/* Store info */}
          <div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--ink-400)', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', gap:6 }}>
              <MapPin size={13}/> Store Details
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-4)', marginBottom:'var(--sp-4)' }}>
              <Info label="Store Name"     value={app.name} />
              <Info label="City"           value={app.city} />
              <Info label="State"          value={app.state} />
              <Info label="PIN Code"       value={app.pincode} />
              <div style={{ gridColumn:'1/-1' }}>
                <Info label="Address" value={app.address_line} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-4)' }}>
              {app.phone && <Info label="Phone" value={app.phone} />}
              {app.email && <Info label="Email" value={app.email} />}
            </div>
          </div>

          {/* Licenses */}
          <div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--ink-400)', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', gap:6 }}>
              <FileText size={13}/> Licenses & Registrations
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-4)' }}>
              <Info label="Drug License No."     value={app.drug_license_no} />
              <Info label="GST Number"           value={app.gst_number} />
              {app.fssai_no && <Info label="FSSAI License" value={app.fssai_no} />}
            </div>
          </div>

          {/* Owner info */}
          {app.owner && (
            <div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' }}>
              <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--ink-400)', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', gap:6 }}>
                <User size={13}/> Owner Details
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-4)' }}>
                <Info label="Name"   value={app.owner.name} />
                <Info label="Mobile" value={app.owner.mobile} />
                <Info label="Email"  value={app.owner.email} />
              </div>
            </div>
          )}

          {/* Uploaded documents */}
          <div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--ink-400)', marginBottom:'var(--sp-4)', display:'flex', alignItems:'center', gap:6 }}>
              <Download size={13}/> Submitted Documents
            </div>
            {app.documents && app.documents.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
                {app.documents.map(doc => (
                  <div key={doc.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--sp-3)', background:'var(--ink-50)', borderRadius:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
                      <FileText size={14} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--ink-800)' }}>{doc.doc_type?.replace(/_/g,' ')}</span>
                    </div>
                    {doc.s3_key
                      ? <a href={`/api/v1/admin/documents/${doc.id}`} target="_blank" rel="noreferrer"
                          style={{ fontSize:12, color:'var(--green-700)', fontWeight:600, textDecoration:'none' }}>
                          View / Download
                        </a>
                      : <span style={{ fontSize:12, color:'var(--ink-400)' }}>Not uploaded</span>
                    }
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize:13, color:'var(--ink-400)', textAlign:'center', padding:'var(--sp-4)' }}>
                No documents uploaded. Document upload is stored as file references — implement S3/storage to view files.
              </div>
            )}
          </div>
        </div>

        {/* Right — verification checklist + actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>

          {app.status === 'pending' && (
            <div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', marginBottom:'var(--sp-4)' }}>
                <ShieldCheck size={17} strokeWidth={1.8} style={{ color:'var(--green-700)' }} />
                <span style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)' }}>Verification Checklist</span>
              </div>
              <p style={{ fontSize:12, color:'var(--ink-400)', marginBottom:'var(--sp-4)' }}>
                Tick all boxes after manual review to enable approval.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)', marginBottom:'var(--sp-5)' }}>
                {verifyChecks.map(({ id:cid, label }) => (
                  <motion.div key={cid}
                    onClick={() => toggle(cid)}
                    style={{ display:'flex', alignItems:'flex-start', gap:'var(--sp-3)', padding:'var(--sp-3)', borderRadius:10, cursor:'pointer', background: checked[cid] ? 'var(--green-50)' : 'var(--ink-50)', border: `1px solid ${checked[cid] ? 'var(--green-200)' : 'var(--ink-100)'}`, transition:'all 0.15s' }}
                    whileTap={{ scale:0.98 }}>
                    <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${checked[cid] ? 'var(--green-700)' : 'var(--ink-300)'}`, background: checked[cid] ? 'var(--green-700)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, transition:'all 0.15s' }}>
                      {checked[cid] && <CheckCircle size={13} strokeWidth={3} style={{ color:'#FFFFFF' }} />}
                    </div>
                    <span style={{ fontSize:13, color: checked[cid] ? 'var(--ink-900)' : 'var(--ink-600)', fontWeight: checked[cid] ? 600 : 400, lineHeight:1.5 }}>{label}</span>
                  </motion.div>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
                <button onClick={handleApprove} disabled={submitting || !allChecked}
                  style={{ width:'100%', padding:'11px', background: allChecked ? 'var(--green-700)' : 'var(--ink-200)', color: allChecked ? '#FFFFFF' : 'var(--ink-400)', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: allChecked ? 'pointer' : 'not-allowed', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.15s' }}>
                  <CheckCircle size={15} strokeWidth={2.5} />
                  {submitting ? 'Processing…' : 'Approve Application'}
                </button>
                <button onClick={() => setShowRejectBox(s => !s)} disabled={submitting}
                  style={{ width:'100%', padding:'11px', background:'var(--white)', color:'var(--danger)', border:'1.5px solid #FECACA', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <XCircle size={15} strokeWidth={2.5} /> Reject
                </button>
              </div>

              {!allChecked && (
                <p style={{ fontSize:11, color:'var(--ink-400)', marginTop:'var(--sp-2)', textAlign:'center' }}>
                  Complete all {verifyChecks.length} checks to enable approval
                </p>
              )}

              <AnimatePresence>
                {showRejectBox && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                    style={{ overflow:'hidden', marginTop:'var(--sp-3)' }}>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection (required)…" rows={3}
                      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--ink-200)', borderRadius:10, fontSize:13, fontFamily:'var(--font-body)', resize:'vertical', outline:'none', boxSizing:'border-box', marginBottom:'var(--sp-2)' }} />
                    <button onClick={handleReject} disabled={submitting}
                      style={{ width:'100%', padding:10, background:'var(--danger)', color:'#FFFFFF', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                      Confirm Rejection
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Status-based action for approved/suspended/rejected */}
          {app.status !== 'pending' && (
            <div style={{ background:'var(--white)', border:'1px solid var(--ink-200)', borderRadius:16, padding:'var(--sp-5)', textAlign:'center' }}>
              {app.status === 'approved' && (
                <>
                  <CheckCircle size={40} strokeWidth={1.5} style={{ color:'var(--success-dark)', margin:'0 auto var(--sp-3)' }} />
                  <p style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)', marginBottom:'var(--sp-4)' }}>Approved & Active</p>
                  <button onClick={handleSuspend} disabled={submitting}
                    style={{ width:'100%', padding:'10px', background:'var(--warning-light)', color:'#92400E', border:'1px solid #FDE68A', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                    Suspend Pharmacy
                  </button>
                </>
              )}
              {app.status === 'suspended' && (
                <>
                  <AlertTriangle size={40} strokeWidth={1.5} style={{ color:'var(--warning-dark)', margin:'0 auto var(--sp-3)' }} />
                  <p style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)', marginBottom:8 }}>Suspended</p>
                  <p style={{ fontSize:13, color:'var(--ink-500)', marginBottom:'var(--sp-4)' }}>This pharmacy is hidden from consumers.</p>
                  <button onClick={handleReactivate} disabled={submitting}
                    style={{ width:'100%', padding:'10px', background:'var(--success-light)', color:'var(--success-dark)', border:'1px solid #6EE7B7', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                    Reactivate Pharmacy
                  </button>
                </>
              )}
              {app.status === 'rejected' && (
                <>
                  <XCircle size={40} strokeWidth={1.5} style={{ color:'var(--danger)', margin:'0 auto var(--sp-3)' }} />
                  <p style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)', marginBottom:8 }}>Application Rejected</p>
                  {app.rejection_reason && <p style={{ fontSize:13, color:'var(--ink-500)' }}>{app.rejection_reason}</p>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
