import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PublicNav from '../components/ui/PublicNav';
import PageTransition from '../components/ui/PageTransition';

// Pages whose hero intentionally sits behind the transparent nav (no padding needed)
const FULL_BLEED_PAGES = ['/', '/for-pharmacies', '/how-it-works', '/about'];

export default function PublicLayout() {
  const location = useLocation();
  // Login and Signup are full-height split layouts — they handle their own spacing
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const isFullBleed = FULL_BLEED_PAGES.includes(location.pathname);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Don't show PublicNav on auth pages — they have their own brand header */}
      {!isAuthPage && <PublicNav />}
      <div style={{ paddingTop: (!isAuthPage && !isFullBleed) ? 68 : 0 }}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </div>
    </div>
  );
}
