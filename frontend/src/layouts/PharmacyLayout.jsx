import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Package, AlertTriangle, ShoppingBag,
  BarChart2, Tag, Store, LogOut, ChevronRight, Menu, X, MessageSquare, Inbox
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import styles from './PharmacyLayout.module.css';

const navItems = [
  { to: '/pharmacy/dashboard',       icon: LayoutDashboard, label: 'Dashboard',      end: true },
  { to: '/pharmacy/inventory',       icon: Package,         label: 'Inventory',      end: true },
  { to: '/pharmacy/inventory/expiry',icon: AlertTriangle,   label: 'Expiry Alerts',  end: false, indent: true },
  { to: '/pharmacy/orders',          icon: ShoppingBag,     label: 'Orders',         end: false },
  { to: '/pharmacy/analytics',       icon: BarChart2,       label: 'Analytics',      end: false },
  { to: '/pharmacy/pricing',         icon: Tag,             label: 'Pricing',        end: false },
  { to: '/pharmacy/notifications',   icon: Inbox,           label: 'Notifications',  end: false },
  { to: '/pharmacy/complaints',      icon: MessageSquare,   label: 'Complaints',     end: false },
  { to: '/pharmacy/profile',         icon: Store,           label: 'Store Profile',  end: false },
];

export default function PharmacyLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          <span className={styles.brandName}>MedMarket</span>
          <span className={styles.brandRole}>Pharmacy</span>
        </div>

        <nav className={styles.nav} aria-label="Pharmacy dashboard navigation">
          {navItems.map(({ to, icon: Icon, label, end, indent }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''} ${indent ? styles.navItemIndent : ''}`
              }
            >
              <Icon size={indent ? 15 : 18} strokeWidth={1.8} />
              <span>{label}</span>
              <ChevronRight size={14} className={styles.navArrow} />
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'Pharmacy Owner'}</span>
              <span className={styles.userStore}>{user?.storeName || 'Your Store'}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} strokeWidth={1.8} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topbar}>
          {/* Mobile hamburger */}
          <button className={styles.hamburger} onClick={() => setMobileOpen(true)}>
            <Menu size={20} strokeWidth={1.8} />
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          </div>
        </div>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                className={styles.drawerOverlay}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                className={styles.drawer}
                initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
              >
                <div className={styles.drawerHeader}>
                  <div className={styles.drawerBrand}>
                    <span className={styles.drawerDot} />
                    <span className={styles.drawerName}>MedMarket</span>
                  </div>
                  <button
                    className={styles.drawerClose}
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    autoFocus
                  >
                    <X size={18} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
                {navItems.map(({ to, icon: Icon, label, end }) => (
                  <NavLink key={to} to={to} end={end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ''}`}
                  >
                    <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                    {label}
                  </NavLink>
                ))}
                <div className={styles.drawerFooter}>
                  <button onClick={handleLogout} className={styles.drawerLogout}>
                    <LogOut size={15} strokeWidth={1.8} aria-hidden="true" /> Logout
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
