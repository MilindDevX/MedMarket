import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Package, AlertTriangle, ShoppingBag,
  BarChart2, Tag, Store, Bell, LogOut, ChevronRight, Menu, X
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useNotifications } from '../hooks/useNotifications';
import styles from './PharmacyLayout.module.css';

const navItems = [
  { to: '/pharmacy/dashboard',       icon: LayoutDashboard, label: 'Dashboard',      end: true },
  { to: '/pharmacy/inventory',       icon: Package,         label: 'Inventory',      end: true },
  { to: '/pharmacy/inventory/expiry',icon: AlertTriangle,   label: 'Expiry Alerts',  end: false, indent: true },
  { to: '/pharmacy/orders',          icon: ShoppingBag,     label: 'Orders',         end: false },
  { to: '/pharmacy/analytics',       icon: BarChart2,       label: 'Analytics',      end: false },
  { to: '/pharmacy/pricing',         icon: Tag,             label: 'Pricing',        end: false },
  { to: '/pharmacy/notifications',   icon: Bell,            label: 'Notifications',  end: false },
  { to: '/pharmacy/profile',         icon: Store,           label: 'Store Profile',  end: false },
];

export default function PharmacyLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount } = useNotifications();

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
            <div style={{ position: 'relative' }}>
              <Bell size={20} strokeWidth={1.8} className={styles.bell}
                onClick={() => navigate('/pharmacy/notifications')}
                style={{ cursor: 'pointer' }} />
              {unreadCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--danger)', color: 'var(--always-white)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </div>
          </div>
        </div>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, background: 'var(--always-dark)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: 'var(--sp-5) var(--sp-3)' }}
                initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-5)', paddingBottom: 'var(--sp-4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-500)', display: 'block' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--always-white)' }}>MedMarket</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} style={{ color: 'var(--always-sub)', padding: 4, borderRadius: 6 }}>
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>
                {navItems.map(({ to, icon: Icon, label, end }) => (
                  <NavLink key={to} to={to} end={end}
                    onClick={() => setMobileOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                      color: isActive ? 'var(--green-300)' : 'var(--always-sub)',
                      background: isActive ? 'rgba(12,107,78,0.25)' : 'transparent',
                      fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s',
                    })}>
                    <Icon size={17} strokeWidth={1.8} />
                    {label}
                  </NavLink>
                ))}
                <div style={{ marginTop: 'auto', paddingTop: 'var(--sp-4)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, color: 'var(--always-sub)', transition: 'all 0.15s', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#FCA5A5'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
                    <LogOut size={15} strokeWidth={1.8} /> Logout
                  </button>
                </div>
              </motion.div>
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
