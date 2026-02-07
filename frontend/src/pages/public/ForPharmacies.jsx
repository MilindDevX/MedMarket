import usePageTitle from '../../utils/usePageTitle';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, BarChart2, AlertTriangle, ShieldCheck, Tag, Package, ArrowRight } from 'lucide-react';

const features = [
  { icon: ShieldCheck, title: 'Verified store badge', desc: 'Get the MedMarket Verified badge after we confirm your Drug License and GST. Consumers see it and trust you instantly.' },
  { icon: AlertTriangle, title: 'Expiry alert system', desc: 'Automated alerts at 60 and 30 days before expiry. Never lose money to expired stock again.' },
  { icon: BarChart2, title: 'Sales analytics', desc: 'Daily, weekly, and monthly revenue charts. Top medicines, order trends, and seasonal demand predictions.' },
  { icon: Tag, title: 'DPCO-compliant pricing', desc: 'Set your prices freely — the platform enforces the MRP ceiling automatically. No compliance risk for you.' },
  { icon: Package, title: 'Inventory tracking', desc: 'Batch-level stock management with low-stock alerts and dead stock detection to keep your shelves optimised.' },
  { icon: CheckCircle, title: 'GST invoice generation', desc: 'Every order automatically generates a GST-compliant invoice and emails it to your consumer. Zero paperwork.' },
];

const faqs = [
  { q: 'How long does verification take?', a: 'Our compliance team typically verifies Drug License and GST documents within 24–48 hours of submission.' },
  { q: 'What documents do I need to register?', a: 'Drug License (Form 20 and/or 21), GST Certificate, Owner Aadhaar card, and store photographs.' },
  { q: 'Is there a fee to join?', a: 'Registration is free. Pricing details for advanced features are available on request — contact our pharmacy support team.' },
  { q: 'Can I list all medicines including prescription drugs?', a: 'In Phase 1, only OTC medicines can be listed. Schedule H, H1, and X prescription drugs are blocked to ensure regulatory compliance.' },
  { q: 'What happens if a consumer places an order I cannot fulfill?', a: 'You can reject any order with a reason. Inventory is automatically restored and the consumer is notified immediately.' },
];

export default function ForPharmacies() {
  usePageTitle('For Pharmacies');

  const navigate = useNavigate();
  return (
    <div style={{ paddingTop: 68 }}>
      {/* Hero */}
      <section style={{ background: 'var(--always-dark)', padding: 'var(--sp-12) var(--sp-6)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-20%', left: '-5%', width: '50%', height: '80%', background: 'radial-gradient(ellipse,rgba(12,107,78,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <motion.div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green-300)', background: 'rgba(93,203,168,0.1)', border: '1px solid rgba(93,203,168,0.25)', padding: '4px 14px', borderRadius: 9999, marginBottom: 'var(--sp-5)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            For Pharmacy Owners
          </motion.div>
          <motion.h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 600, color: 'var(--always-white)', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 'var(--sp-5)' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            Give your pharmacy the tools it deserves
          </motion.h1>
          <motion.p style={{ fontSize: 16, color: 'var(--always-sub)', lineHeight: 1.7, marginBottom: 'var(--sp-6)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            Inventory management, expiry alerts, demand forecasting, and a verified consumer marketplace — all in one platform built specifically for Indian pharmacies.
          </motion.p>
          <motion.button onClick={() => navigate('/pharmacy/register')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'var(--green-700)', color: 'var(--always-white)', border: 'none', borderRadius: 'var(--r-md)', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--green-600)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--green-700)'}>
            Register Your Pharmacy Free <ArrowRight size={17} strokeWidth={2} />
          </motion.button>
          <p style={{ fontSize: 12, color: 'var(--always-sub-muted)', marginTop: 12 }}>Free to register · Verified in 24–48 hours · No upfront cost</p>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: 'var(--neutral-bg)', padding: 'var(--sp-12) var(--sp-6)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-1px', textAlign: 'center', marginBottom: 'var(--sp-8)' }}>Everything you need to run a modern pharmacy</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'var(--sp-5)' }}>
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} style={{ background: 'var(--white)', border: '1px solid var(--ink-200)', borderRadius: 16, padding: 'var(--sp-5)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--green-50)', border: '1px solid var(--green-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--sp-3)' }}>
                  <Icon size={18} strokeWidth={1.8} style={{ color: 'var(--green-700)' }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.65 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'var(--white)', padding: 'var(--sp-12) var(--sp-6)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,34px)', fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.8px', textAlign: 'center', marginBottom: 'var(--sp-8)' }}>Frequently asked questions</h2>
          {faqs.map(({ q, a }, i) => (
            <motion.div key={q} style={{ padding: 'var(--sp-5) 0', borderBottom: '1px solid var(--ink-100)' }} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 8, letterSpacing: '-0.2px' }}>{q}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.65 }}>{a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--green-700)', padding: 'var(--sp-10) var(--sp-6)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,38px)', fontWeight: 600, color: 'var(--always-white)', letterSpacing: '-1px', marginBottom: 'var(--sp-5)' }}>
          Ready to join India's most trusted pharmacy network?
        </h2>
        <button onClick={() => navigate('/pharmacy/register')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: 'var(--white)', color: 'var(--green-700)', border: 'none', borderRadius: 'var(--r-md)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Register Free <ArrowRight size={16} strokeWidth={2} />
        </button>
      </section>
    </div>
  );
}
