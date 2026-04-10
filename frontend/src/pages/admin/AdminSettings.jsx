import usePageTitle from '../../utils/usePageTitle';
import { useState } from 'react';
import { Save, Shield, Tag, Truck, Bell } from 'lucide-react';
import useToastStore from '../../store/toastStore';
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

function Field({ label, value, onChange, type = 'text', suffix }) {
  return (
    <div className={styles.formField}>
      <label className={styles.formLabel}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className={styles.formInput}
          style={{ paddingRight: suffix ? 40 : 12 }} />
        {suffix && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--ink-400)', pointerEvents: 'none' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, sub, value, onChange }) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleInfo}>
        <div className={styles.toggleLabel}>{label}</div>
        {sub && <div className={styles.toggleSub}>{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={styles.toggle}
        aria-checked={value}
        role="switch"
        aria-label={label}
        style={{ background: value ? 'var(--green-700)' : 'var(--ink-200)' }}>
        <span className={styles.toggleThumb} style={{ left: value ? 22 : 2 }} />
      </button>
    </div>
  );
}

export default function AdminSettings() {
  usePageTitle('Platform Settings');
  const toast = useToastStore();

  const [gst,           setGst]           = useState('12');
  const [delivery,      setDelivery]       = useState('30');
  const [freeThreshold, setFreeThreshold]  = useState('200');
  const [codLimit,      setCodLimit]       = useState('2000');
  const [orderTimeout,  setOrderTimeout]   = useState('30');
  const [expiryWarn60,  setExpiryWarn60]   = useState(true);
  const [expiryWarn30,  setExpiryWarn30]   = useState(true);
  const [deadStock,     setDeadStock]      = useState(true);
  const [emailInvoice,  setEmailInvoice]   = useState(true);
  const [smsOnOrder,    setSmsOnOrder]     = useState(true);

  const save = (section) => toast.success(`${section} settings saved.`);

  const compliance = [
    { name: 'DPCO price cap enforcement',    desc: 'Pharmacies cannot list prices above MRP. Enforced by PostgreSQL CHECK constraint.' },
    { name: 'OTC-only listing (Phase 1)',     desc: 'Schedule H, H1, and X medicines are blocked from pharmacy inventory.' },
    { name: 'Drug License verification',      desc: 'All pharmacies require Admin approval before going live.' },
    { name: 'CDSCO master catalogue control', desc: 'Only Admin-managed medicines can be listed. Free-text drug names blocked.' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Platform Settings</h1>
        <p className={styles.subtitle}>Global configuration for MedMarket India</p>
      </div>

      {/* GST & Pricing */}
      <div className={styles.section}>
        <SectionHeader icon={Tag} title="GST & Pricing Rules" />
        <div className={`${styles.fieldGrid} ${styles.field2col}`}>
          <Field label="GST Rate on Medicines (%)" value={gst} onChange={setGst} type="number" suffix="%" />
          <Field label="Flat Delivery Fee (₹)"      value={delivery} onChange={setDelivery} type="number" suffix="₹" />
        </div>
        <div className={`${styles.fieldGrid} ${styles.field2col}`}>
          <Field label="Free Delivery Threshold (₹)" value={freeThreshold} onChange={setFreeThreshold} type="number" suffix="₹" />
        </div>
        <p className={styles.note}>
          GST applies to all order subtotals. Pharmacies cannot set prices above government MRP (DPCO enforcement). These rules are enforced by database constraints and cannot be bypassed.
        </p>
        <button className={styles.saveBtn} onClick={() => save('Pricing')}>
          <Save size={14} strokeWidth={2.5} /> Save Pricing Settings
        </button>
      </div>

      {/* Order Rules */}
      <div className={styles.section}>
        <SectionHeader icon={Truck} title="Order Rules" />
        <div className={`${styles.fieldGrid} ${styles.field2col}`} style={{ marginBottom: 'var(--sp-4)' }}>
          <Field label="COD Order Limit (₹)"                value={codLimit}     onChange={setCodLimit}     type="number" suffix="₹" />
          <Field label="Pharmacy Accept Timeout (minutes)"   value={orderTimeout} onChange={setOrderTimeout} type="number" suffix="min" />
        </div>
        <p className={styles.note}>
          Orders above the COD limit cannot use Cash on Delivery. If a pharmacy does not accept or reject within the timeout, the order is auto-rejected and inventory is restored.
        </p>
        <button className={styles.saveBtn} onClick={() => save('Order')}>
          <Save size={14} strokeWidth={2.5} /> Save Order Settings
        </button>
      </div>

      {/* Notifications */}
      <div className={styles.section}>
        <SectionHeader icon={Bell} title="Notification & Alert Rules" />
        <Toggle label="60-day expiry warning"   sub="In-app alert when a medicine batch is 60 days from expiry"      value={expiryWarn60} onChange={setExpiryWarn60} />
        <Toggle label="30-day expiry SMS alert"  sub="SMS to pharmacy owner when batch is 30 days from expiry"        value={expiryWarn30} onChange={setExpiryWarn30} />
        <Toggle label="Dead stock detection"     sub="Alert pharmacy when an item has no sales in 45 days"            value={deadStock}    onChange={setDeadStock} />
        <Toggle label="GST invoice email"        sub="Auto-generate and email GST invoice on order delivery"          value={emailInvoice} onChange={setEmailInvoice} />
        <Toggle label="SMS on order events"      sub="SMS to consumer on order accepted, dispatched, and delivered"   value={smsOnOrder}   onChange={setSmsOnOrder} />
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <button className={styles.saveBtn} onClick={() => save('Notification')}>
            <Save size={14} strokeWidth={2.5} /> Save Notification Settings
          </button>
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
