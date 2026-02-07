import usePageTitle from '../../utils/usePageTitle';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, ShoppingCart, Truck, BarChart2, ArrowRight } from 'lucide-react';

const consumerSteps = [
  { icon: Search, step: '01', title: 'Search medicines near you', desc: 'Enter your PIN code or allow location access. See all verified pharmacies within your area with real-time stock and price data.' },
  { icon: ShieldCheck, step: '02', title: 'Browse verified stores', desc: 'Every store on MedMarket is CDSCO Drug License verified. Look for the MedMarket Verified badge — it means the store has passed our compliance check.' },
  { icon: ShoppingCart, step: '03', title: 'Compare prices and order', desc: 'See the same OTC medicine across multiple nearby stores. Choose the best price — all capped at government MRP — and place your order.' },
  { icon: Truck, step: '04', title: 'Track your delivery', desc: 'Follow your order through 5 real-time stages: Confirmed → Accepted → Packing → Dispatched → Delivered. SMS updates at every step.' },
];

const pharmacySteps = [
  { icon: ShieldCheck, step: '01', title: 'Register and get verified', desc: 'Submit your Drug License (Form 20/21), GST certificate, and owner documents. Our compliance team verifies within 24–48 hours.' },
  { icon: ShoppingCart, step: '02', title: 'List your inventory', desc: 'Add medicines from our CDSCO-approved master catalogue. Enter batch numbers and expiry dates — tracked automatically from day one.' },
  { icon: Truck, step: '03', title: 'Receive and fulfill orders', desc: 'Consumers in your area discover your listings. Accept incoming orders, pack them, and mark as dispatched — all from your mobile.' },
  { icon: BarChart2, step: '04', title: 'Grow with analytics', desc: 'Your dashboard shows sales trends, near-expiry alerts, dead stock reports, and seasonal demand predictions to keep your pharmacy profitable.' },
];

const StepCard = ({ icon: Icon, step, title, desc, i }) => (
  <motion.div style={{ display: 'flex', gap: 'var(--sp-4)', padding: 'var(--sp-5) 0', borderBottom: '1px solid var(--ink-100)' }}
    initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--green-50)', border: '1px solid var(--green-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} strokeWidth={1.8} style={{ color: 'var(--green-700)' }} />
    </div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-700)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Step {step}</div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 6, letterSpacing: '-0.2px' }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.65 }}>{desc}</p>
    </div>
  </motion.div>
);

export default function HowItWorks() {
  usePageTitle('How It Works');

  const navigate = useNavigate();
  return (
    <div style={{ paddingTop: 68 }}>
      {/* Hero */}
      <section style={{ background: 'var(--always-dark)', padding: 'var(--sp-12) var(--sp-6)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <motion.h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,50px)', fontWeight: 600, color: 'var(--always-white)', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 'var(--sp-4)' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            How MedMarket works
          </motion.h1>
          <motion.p style={{ fontSize: 16, color: 'var(--always-sub)', lineHeight: 1.7 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
            Whether you're a patient finding medicines or a pharmacy wanting to grow, here's exactly what happens on MedMarket.
          </motion.p>
        </div>
      </section>

      {/* Two columns */}
      <section style={{ background: 'var(--neutral-bg)', padding: 'var(--sp-12) var(--sp-6)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-10)' }}>
          {/* Consumer */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green-700)', background: 'var(--green-50)', border: '1px solid var(--green-200)', padding: '4px 12px', borderRadius: 9999, marginBottom: 'var(--sp-4)' }}>
              For Patients
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.5px', marginBottom: 'var(--sp-5)' }}>Find and order medicines near you</h2>
            {consumerSteps.map((step, i) => <StepCard key={step.step} {...step} i={i} />)}
            <button onClick={() => navigate('/login')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 'var(--sp-6)', padding: '12px 24px', background: 'var(--green-700)', color: 'var(--always-white)', border: 'none', borderRadius: 'var(--r-md)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Find medicines near me <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Pharmacy */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue-700)', background: 'var(--blue-50)', border: '1px solid var(--blue-300)', padding: '4px 12px', borderRadius: 9999, marginBottom: 'var(--sp-4)' }}>
              For Pharmacies
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.5px', marginBottom: 'var(--sp-5)' }}>Register and start selling online</h2>
            {pharmacySteps.map((step, i) => <StepCard key={step.step} {...step} i={i} />)}
            <button onClick={() => navigate('/pharmacy/register')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 'var(--sp-6)', padding: '12px 24px', background: 'var(--always-dark)', color: 'var(--always-white)', border: 'none', borderRadius: 'var(--r-md)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Register your pharmacy <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
