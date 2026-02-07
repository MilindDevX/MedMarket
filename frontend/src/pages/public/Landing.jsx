import usePageTitle from '../../utils/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, MapPin, TrendingUp, AlertTriangle,
  ArrowRight, CheckCircle, Store, Users, Package
} from 'lucide-react';
import styles from './Landing.module.css';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, type: 'spring', stiffness: 260, damping: 22 },
});

const stats = [
  { value: '2,400+', label: 'Verified Pharmacies' },
  { value: '1.2L+', label: 'Patients Served' },
  { value: '99.1%', label: 'Order Accuracy' },
  { value: '< 45min', label: 'Avg. Delivery Time' },
];

const problems = [
  { icon: AlertTriangle, title: 'Counterfeit Medicines', desc: 'India loses ₹4,000 Cr annually to fake drugs. Every pharmacy on MedMarket is CDSCO-verified before going live.' },
  { icon: Package, title: 'Expiry & Dead Stock', desc: 'Pharmacies write off crores in expired stock yearly. Our AI-powered expiry alerts eliminate losses before they happen.' },
  { icon: TrendingUp, title: 'Zero Price Visibility', desc: 'Consumers overpay without knowing. MedMarket enforces DPCO-compliant pricing across every store on the platform.' },
];

const pharmacyFeatures = [
  'Multi-step store registration with CDSCO document verification',
  'Inventory management with automated expiry alerts at 60 & 30 days',
  'Real-time order queue with accept, pack, and dispatch workflow',
  'Sales analytics and seasonal demand prediction dashboard',
  'Dead stock detection and smart discount recommendations',
  'DPCO-compliant pricing enforced at the platform level',
];

const howItWorks = [
  { step: '01', title: 'Register your store', desc: 'Submit your Drug License, GST certificate, and store details. Verification takes 24–48 hours.' },
  { step: '02', title: 'List your inventory', desc: 'Add medicines from our master CDSCO catalogue. Batch numbers and expiry dates are tracked automatically.' },
  { step: '03', title: 'Receive & fulfill orders', desc: 'Consumers near your store discover your listings. Accept orders, pack them, and mark as dispatched.' },
  { step: '04', title: 'Grow with data', desc: 'Use your analytics dashboard to spot demand trends, reduce dead stock, and increase revenue.' },
];

export default function Landing() {
  usePageTitle('MedMarket India');

  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroBlob1} />
          <div className={styles.heroBlob2} />
          <div className={styles.heroGrid} />
        </div>
        <div className={styles.heroInner}>
          <motion.div className={styles.heroBadge} {...fadeUp(0)}>
            <ShieldCheck size={13} strokeWidth={2.5} />
            <span>CDSCO & GST Verified Platform · India</span>
          </motion.div>

          <motion.h1 className={styles.heroTitle} {...fadeUp(0.08)}>
            India's Most Trusted
            <span className={styles.heroAccent}> Medicine</span>
            <br />Marketplace
          </motion.h1>

          <motion.p className={styles.heroSub} {...fadeUp(0.16)}>
            Connecting verified pharmacies with patients across India.
            Genuine medicines, transparent pricing, and real-time order tracking —
            all in one DPCO-compliant platform.
          </motion.p>

          <motion.div className={styles.heroCtas} {...fadeUp(0.22)}>
            <button className={styles.ctaPrimary} onClick={() => navigate('/pharmacy/register')}>
              Register Your Pharmacy
              <ArrowRight size={18} strokeWidth={2} />
            </button>
            <button className={styles.ctaSecondary} onClick={() => navigate('/login')}>
              Find Medicines Near You
            </button>
          </motion.div>

          <motion.div className={styles.heroTrust} {...fadeUp(0.30)}>
            {['Drug License Verified', 'GST Compliant', 'DPCO Enforced', 'CDSCO Approved'].map(t => (
              <div key={t} className={styles.trustItem}>
                <CheckCircle size={13} strokeWidth={2.5} />
                <span>{t}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Floating cards */}
        <div className={styles.heroVisual}>
          <motion.div
            className={styles.floatCard}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          >
            <div className={styles.floatCardHeader}>
              <div className={styles.floatAvatar}>S</div>
              <div>
                <div className={styles.floatStoreName}>Sharma Medical Store</div>
                <div className={styles.floatVerified}>
                  <ShieldCheck size={10} strokeWidth={2.5} />
                  MedMarket Verified
                </div>
              </div>
            </div>
            <div className={styles.floatStats}>
              <div><div className={styles.floatStat}>412</div><div className={styles.floatStatLabel}>SKUs</div></div>
              <div><div className={styles.floatStat}>4.8★</div><div className={styles.floatStatLabel}>Rating</div></div>
              <div><div className={styles.floatStat}>0.4km</div><div className={styles.floatStatLabel}>Away</div></div>
            </div>
          </motion.div>

          <motion.div
            className={`${styles.floatCard} ${styles.floatCardAlt}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, type: 'spring', stiffness: 200 }}
          >
            <div className={styles.alertRow}>
              <AlertTriangle size={14} strokeWidth={2} style={{ color: 'var(--warning-dark)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-800)' }}>Expiry Alert</span>
              <span style={{ fontSize: 11, color: 'var(--ink-500)', marginLeft: 'auto' }}>28 days</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', marginTop: 6 }}>ORS Electral · 60 strips</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>Batch MFG/2024/B044 · EXP 19 Apr 2026</div>
          </motion.div>

          <motion.div
            className={`${styles.floatCard} ${styles.floatCardGreen}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-700)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Today's Revenue</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.5px' }}>₹8,240</div>
            <div style={{ fontSize: 12, color: 'var(--green-700)', fontWeight: 500, marginTop: 2 }}>↑ 12% vs yesterday</div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className={styles.statsStrip}>
        {stats.map(({ value, label }, i) => (
          <motion.div
            key={label}
            className={styles.statItem}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
          </motion.div>
        ))}
      </section>

      {/* ── Problems we solve ── */}
      <section className={styles.problems}>
        <div className={styles.sectionInner}>
          <motion.div
            className={styles.sectionTag}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            Why MedMarket
          </motion.div>
          <motion.h2
            className={styles.sectionTitle}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
            The problems we're fixing
          </motion.h2>
          <div className={styles.problemsGrid}>
            {problems.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                className={styles.problemCard}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className={styles.problemIcon}>
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <h3 className={styles.problemTitle}>{title}</h3>
                <p className={styles.problemDesc}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Pharmacies ── */}
      <section className={styles.forPharmacies}>
        <div className={styles.sectionInner}>
          <div className={styles.pharmacyGrid}>
            <div className={styles.pharmacyLeft}>
              <div className={styles.sectionTag} style={{ color: 'var(--green-300)', borderColor: 'rgba(93,203,168,0.3)', background: 'rgba(93,203,168,0.1)' }}>
                For Pharmacy Owners
              </div>
              <h2 className={styles.sectionTitle} style={{ color: 'var(--always-white)' }}>
                Everything your pharmacy needs to thrive
              </h2>
              <p style={{ fontSize: 16, color: 'var(--always-sub)', lineHeight: 1.7, marginTop: 'var(--sp-3)' }}>
                From inventory management to demand prediction, MedMarket gives you the tools that large pharmacy chains have — at no upfront cost.
              </p>
              <div className={styles.featureList}>
                {pharmacyFeatures.map((f, i) => (
                  <motion.div
                    key={i}
                    className={styles.featureItem}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <CheckCircle size={15} strokeWidth={2.5} />
                    <span>{f}</span>
                  </motion.div>
                ))}
              </div>
              <button
                className={styles.ctaPrimary}
                style={{ marginTop: 'var(--sp-6)' }}
                onClick={() => navigate('/pharmacy/register')}
              >
                Register Your Store Free
                <ArrowRight size={17} strokeWidth={2} />
              </button>
            </div>

            <div className={styles.pharmacyRight}>
              <div className={styles.dashPreview}>
                <div className={styles.dashHeader}>
                  <div className={styles.dashDots}>
                    <span style={{ background: '#EF4444' }} />
                    <span style={{ background: '#F59E0B' }} />
                    <span style={{ background: '#10B981' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--always-sub-faint)' }}>pharmacy dashboard</span>
                </div>
                <div className={styles.dashGrid}>
                  {[
                    { label: 'Revenue Today', val: '₹8,240', color: 'var(--green-500)' },
                    { label: 'Active Orders', val: '34', color: 'var(--blue-300)' },
                    { label: 'Expiry Alerts', val: '7', color: 'var(--warning-dark)' },
                    { label: 'Stock Items', val: '412', color: 'var(--always-white)' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className={styles.dashCard}>
                      <div style={{ fontSize: 10, color: 'var(--always-sub-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div className={styles.dashAlert}>
                  <AlertTriangle size={13} strokeWidth={2} style={{ color: 'var(--warning-dark)', flexShrink: 0 }} />
                  <span>ORS Electral · Batch B044 expires in 28 days — consider discounting</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={styles.howSection}>
        <div className={styles.sectionInner}>
          <motion.div className={styles.sectionTag} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            Getting Started
          </motion.div>
          <motion.h2 className={styles.sectionTitle} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Up and running in 48 hours
          </motion.h2>
          <div className={styles.howGrid}>
            {howItWorks.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                className={styles.howCard}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={styles.howStep}>{step}</div>
                <h3 className={styles.howTitle}>{title}</h3>
                <p className={styles.howDesc}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.sectionInner}>
          <motion.h2
            className={styles.ctaBannerTitle}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
            Ready to join India's most trusted pharmacy network?
          </motion.h2>
          <motion.div
            className={styles.ctaBannerActions}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          >
            <button className={styles.ctaPrimary} onClick={() => navigate('/pharmacy/register')}>
              Register Your Pharmacy
              <ArrowRight size={17} strokeWidth={2} />
            </button>
            <button className={styles.ctaSecondary} onClick={() => navigate('/login')}>
              I'm a Patient
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.sectionInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <span className={styles.brandDot} />
              <span className={styles.brandName}>MedMarket India</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-500)', maxWidth: 340 }}>
              India's CDSCO-compliant medicine marketplace. Verified pharmacies, transparent pricing, real-time tracking.
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 MedMarket India. All rights reserved.</span>
            <span>CDSCO Compliant · DPCO Enforced · GST Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
