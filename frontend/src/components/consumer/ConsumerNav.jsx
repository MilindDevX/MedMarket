import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, MapPin, LogOut, Pill, Store, Menu, X, ClipboardList, Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useLocationStore from '../../store/locationStore';
import { useNotifications } from '../../hooks/useNotifications';
import styles from './ConsumerNav.module.css';

const navLinks = [
  { to: '/consumer/stores',        label: 'Stores',        icon: Store },
  { to: '/consumer/medicines',     label: 'Medicines',     icon: Pill },
  { to: '/consumer/notifications', label: 'Notifications', icon: Bell },
  { to: '/consumer/orders',        label: 'Orders',        icon: ClipboardList },
];

export default function ConsumerNav() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.qty, 0));
  const city = useLocationStore(s => s.city);
  const { unreadCount } = useNotifications();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className={styles.nav} role="banner">
      <div className={styles.inner}>
        <Link to="/consumer/home" className={styles.brand}>
          <span className={styles.brandDot} />
          <span className={styles.brandName}>MedMarket</span>
        </Link>

        <div className={styles.location}>
          <MapPin size={12} strokeWidth={2} />
          <span>{city || 'Set location'}</span>
        </div>

        <nav className={styles.links}>
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isNotif = to.includes('notification');
            return (
              <Link key={to} to={to}
                className={`${styles.link} ${location.pathname.startsWith(to) ? styles.linkActive : ''}`}
                style={{ position:'relative', display:'inline-flex', alignItems:'center', gap:5 }}>
                <span style={{ position:'relative', display:'inline-flex' }}>
                  <Icon size={14} strokeWidth={2} />
                  {isNotif && unreadCount > 0 && (
                    <span style={{ position:'absolute', top:-5, right:-6, width:14, height:14, borderRadius:'50%', background:'var(--danger)', color:'#fff', fontSize:8, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.right}>
          {/* Cart badge */}
          <button className={styles.cartBtn} aria-label="View shopping cart" onClick={() => navigate('/consumer/cart')}>
            <ShoppingCart size={18} strokeWidth={2} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span className={styles.cartBadge}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button className={styles.profileBtn} onClick={() => navigate('/consumer/profile')}>
            <div className={styles.avatar}>{user?.name?.charAt(0) || 'P'}</div>
          </button>

          <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Log out of your account">
            <LogOut size={16} strokeWidth={1.8} />
            <span>Logout</span>
          </button>

          <button className={styles.hamburger} aria-label="Open navigation menu" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className={styles.mobileMenu}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}>
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={`${styles.mobileLink} ${location.pathname.startsWith(to) ? styles.mobileLinkActive : ''}`}
                onClick={() => setMobileOpen(false)}>
                <Icon size={16} strokeWidth={1.8} />{label}
              </Link>
            ))}
            <div className={styles.mobileDivider} />
            <button className={styles.mobileLogout} onClick={handleLogout}>
              <LogOut size={15} strokeWidth={1.8} /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
