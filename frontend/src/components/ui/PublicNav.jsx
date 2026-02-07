import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './PublicNav.module.css';

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Landing page has a dark hero — nav starts transparent with white text.
  // All other public pages have a light background — nav always shows dark text.
  const isLanding = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // On non-landing pages, behave as if always scrolled (white bg, dark text)
  const showDark = !isLanding || scrolled;

  return (
    <header className={`${styles.nav} ${showDark ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link to="/" className={styles.brand}>
          <span className={styles.brandDot} />
          <span className={styles.brandName}>MedMarket</span>
          <span className={styles.brandSuffix}>India</span>
        </Link>

        {/* Desktop links */}
        <nav className={styles.links} aria-label="Main navigation">
          <Link to="/how-it-works" className={`${styles.link} ${pathname === "/how-it-works" ? styles.linkActive : ""}`}>How it works</Link>
          <Link to="/for-pharmacies" className={`${styles.link} ${pathname === "/for-pharmacies" ? styles.linkActive : ""}`}>For Pharmacies</Link>
          <Link to="/about" className={`${styles.link} ${pathname === "/about" ? styles.linkActive : ""}`}>About</Link>
        </nav>

        {/* Desktop CTA */}
        <div className={styles.ctas}>
          <button className={styles.loginBtn} onClick={() => navigate('/login')}>Log in</button>
          <button className={styles.signupBtn} onClick={() => navigate('/signup')}>Get started free</button>
          <button className={styles.registerBtn} onClick={() => navigate('/pharmacy/register')}>
            Register Store
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className={styles.hamburger} aria-label="Toggle mobile menu" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Link to="/how-it-works" className={styles.mobileLink} onClick={() => setOpen(false)}>How it works</Link>
            <Link to="/for-pharmacies" className={styles.mobileLink} onClick={() => setOpen(false)}>For Pharmacies</Link>
            <Link to="/about" aria-current={pathname === '/about' ? 'page' : undefined} className={styles.mobileLink} onClick={() => setOpen(false)}>About</Link>
            <div className={styles.mobileCtas}>
              <button className={styles.loginBtn} onClick={() => { navigate('/login'); setOpen(false); }}>Log in</button>
              <button className={styles.signupBtn} onClick={() => { navigate('/signup'); setOpen(false); }}>Get started free</button>
              <button className={styles.registerBtn} onClick={() => { navigate('/pharmacy/register'); setOpen(false); }}>Register Store</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
