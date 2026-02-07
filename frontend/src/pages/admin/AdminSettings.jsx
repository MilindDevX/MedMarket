import usePageTitle from '../../utils/usePageTitle';
import { useState, useEffect } from 'react';
import { Save, Shield, Tag, Truck, Bell, Loader } from 'lucide-react';
import useToastStore from '../../store/toastStore';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import { SkeletonCard } from '../../components/ui/Skeleton';
import styles from './AdminSettings.module.css';

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionIcon}>
        <Icon size={16} strokeWidth={1.8} style={{ color: 'var(--green-700)' }} />
      </div>
      <h3 className={styles.sectionTitle}>{title}</h3>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', suffix, disabled }) {
  return (
    <div className={styles.formField}>
      <label className={styles.formLabel}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={styles.formInput}
          style={{ paddingRight: suffix ? 40 : 12, opacity: disabled ? 0.6 : 1 }}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--ink-400)', pointerEvents: 'none' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, sub, value, onChange, disabled }) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleInfo}>
        <div className={styles.toggleLabel}>{label}</div>
        {sub && <div className={styles.toggleSub}>{sub}</div>}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        className={styles.toggle}
        aria-checked={value}
        role="switch"
        aria-label={label}
        disabled={disabled}
        style={{ background: value ? 'var(--green-700)' : 'var(--ink-200)', opacity: disabled ? 0.6 : 1 }}>
        <span className={styles.toggleThumb} style={{ left: value ? 22 : 2 }} />
      </button>
    </div>
  );
}

function SaveButton({ label, onClick, saving, disabled }) {
  return (
    <button className={styles.saveBtn} onClick={onClick} disabled={disabled || saving}
      style={{ opacity: (disabled || saving) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
      {saving
        ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
        : <><Save size={14} strokeWidth={2.5} /> {label}</>
      }
    </button>
  );
}

export default function AdminSettings() {
  usePageTitle('Platform Settings');
  const toast = useToastStore();
  const { settings, loading, saving, error, save } = useAdminSettings();

  // Local state — initialised from API data once loaded
  const [gst,           setGst]          = useState('12');
  const [delivery,      setDelivery]     = useState('30');
  const [freeThreshold, setFreeThreshold]= useState('200');
  const [codLimit,      setCodLimit]     = useState('2000');
  const [orderTimeout,  setOrderTimeout] = useState('30');
  const [expiryWarn60,  setExpiryWarn60] = useState(true);
  const [expiryWarn30,  setExpiryWarn30] = useState(true);
  const [deadStock,     setDeadStock]    = useState(true);
  const [emailInvoice,  setEmailInvoice] = useState(true);
  const [smsOnOrder,    setSmsOnOrder]   = useState(true);

  // Populate local state once API data arrives
  useEffect(() => {
    if (!settings) return;
    setGst(String(settings.gst_rate ?? 12));
    setDelivery(String(settings.delivery_fee ?? 30));
    setFreeThreshold(String(settings.free_delivery_threshold ?? 200));
    setCodLimit(String(settings.cod_limit ?? 2000));
    setOrderTimeout(String(settings.order_timeout_minutes ?? 30));
    setExpiryWarn60(settings.expiry_warn_60 ?? true);
    setExpiryWarn30(settings.expiry_warn_30 ?? true);
    setDeadStock(settings.dead_stock_alert ?? true);
    setEmailInvoice(settings.email_invoice ?? true);
    setSmsOnOrder(settings.sms_on_order ?? true);
  }, [settings]);

  const handleSave = async (section, patch) => {
    try {
      await save(patch);
      toast.success(`${section} settings saved.`);
    } catch (err) {
      toast.error(err.message || `Failed to save ${section} settings.`);
    }
  };

  const compliance = [
    { name: 'DPCO price cap enforcement',    desc: 'Pharmacies cannot list prices above MRP. Enforced by PostgreSQL CHECK constraint.' },
    { name: 'OTC-only listing (Phase 1)',     desc: 'Schedule H, H1, and X medicines are blocked from pharmacy inventory.' },
    { name: 'Drug License verification',      desc: 'All pharmacies require Admin approval before going live.' },
    { name: 'CDSCO master catalogue control', desc: 'Only Admin-managed medicines can be listed. Free-text drug names blocked.' },
  ];

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Platform Settings</h1>
        <p className={styles.subtitle}>Global configuration for MedMarket India</p>
      </div>
      <SkeletonCard lines={6} />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={6} />
    </div>
  );

  if (error) return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Platform Settings</h1>
      </div>
      <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 10, padding: 'var(--sp-4)', color: 'var(--danger-dark)' }}>
        Failed to load settings: {error}
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Platform Settings</h1>
        <p className={styles.subtitle}>Global configuration for MedMarket India</p>
      </div>

      {/* GST & Pricing */}
      <div className={styles.section}>
        <SectionHeader icon={Tag} title="GST & Pricing Rules" />
        <div className={`${styles.fieldGrid} ${styles.field2col}`}>
          <Field label="GST Rate on Medicines (%)" value={gst} onChange={setGst} type="number" suffix="%" disabled={saving} />
          <Field label="Flat Delivery Fee (₹)"     value={delivery} onChange={setDelivery} type="number" suffix="₹" disabled={saving} />
        </div>
        <div className={`${styles.fieldGrid} ${styles.field2col}`}>
          <Field label="Free Delivery Threshold (₹)" value={freeThreshold} onChange={setFreeThreshold} type="number" suffix="₹" disabled={saving} />
        </div>
        <p className={styles.note}>
          GST applies to all order subtotals. Pharmacies cannot set prices above government MRP (DPCO enforcement). These rules are enforced by database constraints and cannot be bypassed.
        </p>
        <SaveButton
          label="Save Pricing Settings"
          saving={saving}
          onClick={() => handleSave('Pricing', {
            gst_rate: parseFloat(gst),
            delivery_fee: parseFloat(delivery),
            free_delivery_threshold: parseFloat(freeThreshold),
          })}
        />
      </div>

      {/* Order Rules */}
      <div className={styles.section}>
        <SectionHeader icon={Truck} title="Order Rules" />
        <div className={`${styles.fieldGrid} ${styles.field2col}`} style={{ marginBottom: 'var(--sp-4)' }}>
          <Field label="COD Order Limit (₹)"               value={codLimit}     onChange={setCodLimit}     type="number" suffix="₹"  disabled={saving} />
          <Field label="Pharmacy Accept Timeout (minutes)"  value={orderTimeout} onChange={setOrderTimeout} type="number" suffix="min" disabled={saving} />
        </div>
        <p className={styles.note}>
          Orders above the COD limit cannot use Cash on Delivery. If a pharmacy does not accept or reject within the timeout, the order is auto-rejected and inventory is restored.
        </p>
        <SaveButton
          label="Save Order Settings"
          saving={saving}
          onClick={() => handleSave('Order', {
            cod_limit: parseFloat(codLimit),
            order_timeout_minutes: parseInt(orderTimeout, 10),
          })}
        />
      </div>

      {/* Notifications */}
      <div className={styles.section}>
        <SectionHeader icon={Bell} title="Notification & Alert Rules" />
        <Toggle label="60-day expiry warning"  sub="In-app alert when a medicine batch is 60 days from expiry"    value={expiryWarn60} onChange={setExpiryWarn60} disabled={saving} />
        <Toggle label="30-day expiry SMS alert" sub="SMS to pharmacy owner when batch is 30 days from expiry"      value={expiryWarn30} onChange={setExpiryWarn30} disabled={saving} />
        <Toggle label="Dead stock detection"    sub="Alert pharmacy when an item has no sales in 45 days"          value={deadStock}    onChange={setDeadStock}    disabled={saving} />
        <Toggle label="GST invoice email"       sub="Auto-generate and email GST invoice on order delivery"        value={emailInvoice} onChange={setEmailInvoice}  disabled={saving} />
        <Toggle label="SMS on order events"     sub="SMS to consumer on order accepted, dispatched, and delivered" value={smsOnOrder}   onChange={setSmsOnOrder}    disabled={saving} />
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <SaveButton
            label="Save Notification Settings"
            saving={saving}
            onClick={() => handleSave('Notification', {
              expiry_warn_60:  expiryWarn60,
              expiry_warn_30:  expiryWarn30,
              dead_stock_alert: deadStock,
              email_invoice:   emailInvoice,
              sms_on_order:    smsOnOrder,
            })}
          />
        </div>
      </div>

      {/* Compliance */}
      <div className={styles.section}>
        <SectionHeader icon={Shield} title="Compliance" />
        {compliance.map(({ name, desc }) => (
          <div key={name} className={styles.complianceCard}
            style={{ background: 'var(--success-light)', border: '1px solid #6EE7B7' }}>
            <div className={styles.complianceHeader}>
              <span className={styles.complianceName}>{name}</span>
              <span className={styles.complianceStatus}
                style={{ color: 'var(--success-dark)', background: 'rgba(16,185,129,0.12)' }}>
                Active
              </span>
            </div>
            <p className={styles.complianceDesc}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
