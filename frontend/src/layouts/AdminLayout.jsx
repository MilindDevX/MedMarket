import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, Database, ShoppingCart,
  BarChart2, MessageSquare, Users, Settings, LogOut, ChevronRight, Shield, Bell
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import styles from './AdminLayout.module.css';
import PageTransition from '../components/ui/PageTransition';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/pharmacies', icon: Store, label: 'Pharmacies' },
  { to: '/admin/medicines', icon: Database, label: 'Medicine DB' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'All Orders' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/admin/notifications', icon: Bell,         label: 'Notifications', end: false },
  { to: '/admin/complaints', icon: MessageSquare, label: 'Complaints' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Shield size={16} className={styles.brandIcon} />
          <span className={styles.brandName}>MedMarket</span>
          <span className={styles.brandRole}>Admin</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin/dashboard'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              <ChevronRight size={13} className={styles.navArrow} />
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{user?.name?.charAt(0) || 'A'}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'Admin'}</span>
              <span className={styles.userRole}>Platform Admin</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={15} strokeWidth={1.8} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.content}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
