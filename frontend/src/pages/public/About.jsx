import usePageTitle from '../../utils/usePageTitle';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, Users, MapPin } from 'lucide-react';

const values = [
  { icon: ShieldCheck, title: 'Trust First', desc: 'Every pharmacy on MedMarket is verified against their CDSCO Drug License and GST credentials before a single medicine is listed.' },
  { icon: TrendingUp, title: 'Transparency', desc: 'Prices are visible, comparable, and capped at government MRP. No hidden charges. GST invoices generated automatically.' },
  { icon: Users, title: 'Built for India', desc: 'Designed for the Indian pharmaceutical ecosystem — CDSCO compliance, DPCO pricing, GST invoicing, and regional language support on the roadmap.' },
  { icon: MapPin, title: 'Local Commerce', desc: 'We believe your neighbourhood pharmacy deserves the tools that large pharmacy chains have. MedMarket levels the playing field.' },
];

const stats = [
  { val: '142+', label: 'Verified Pharmacies' },
  { val: '8,400+', label: 'Patients Served' },
  { val: '6', label: 'Cities in Haryana' },
  { val: '₹18L+', label: 'Monthly GMV' },
];

export default function About() {
  usePageTitle('About Us');

  return (
    <div style={{ paddingTop: 68 }}>
      {/* Hero */}
      <section style={{ background: 'var(--always-dark)', padding: 'var(--sp-12) var(--sp-6)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <motion.div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green-300)', background: 'rgba(93,203,168,0.1)', border: '1px solid rgba(93,203,168,0.25)', padding: '4px 14px', borderRadius: 9999, marginBottom: 'var(--sp-5)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            About MedMarket India
          </motion.div>
          <motion.h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 600, color: 'var(--always-white)', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 'var(--sp-5)' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            India deserves a trustworthy medicine marketplace
          </motion.h1>
          <motion.p style={{ fontSize: 17, color: 'var(--always-sub)', lineHeight: 1.7, marginBottom: 'var(--sp-6)' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            MedMarket was founded on a simple belief: every Indian should be able to buy genuine, affordable medicines from a verified local pharmacy — with complete price transparency and a digital paper trail.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--white)', borderBottom: '1px solid var(--ink-200)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {stats.map(({ val, label }, i) => (
            <motion.div key={label} style={{ textAlign: 'center', padding: 'var(--sp-6)', borderRight: i < 3 ? '1px solid var(--ink-200)' : 'none' }} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, color: 'var(--green-700)', letterSpacing: '-1px' }}>{val}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4, fontWeight: 500 }}>{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section style={{ background: 'var(--neutral-bg)', padding: 'var(--sp-12) var(--sp-6)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-1px', textAlign: 'center', marginBottom: 'var(--sp-8)' }}>What we stand for</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--sp-5)' }}>
            {values.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} style={{ background: 'var(--white)', border: '1px solid var(--ink-200)', borderRadius: 16, padding: 'var(--sp-6)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--green-50)', border: '1px solid var(--green-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--sp-4)' }}>
                  <Icon size={20} strokeWidth={1.8} style={{ color: 'var(--green-700)' }} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 'var(--sp-2)', letterSpacing: '-0.2px' }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.65 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ background: 'var(--green-700)', padding: 'var(--sp-10) var(--sp-6)', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 600, color: 'var(--always-white)', letterSpacing: '-1px', lineHeight: 1.2 }}>
            "Make genuine medicines accessible, affordable, and traceable for every Indian."
          </h2>
          <p style={{ fontSize: 14, color: 'var(--always-sub)', marginTop: 'var(--sp-4)' }}>— The MedMarket India Mission</p>
        </div>
      </section>
    </div>
  );
}
