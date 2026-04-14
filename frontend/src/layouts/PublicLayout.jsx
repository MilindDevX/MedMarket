import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PublicNav from '../components/ui/PublicNav';
import PageTransition from '../components/ui/PageTransition';

const FULL_BLEED_PAGES = ['/', '/for-pharmacies', '/how-it-works', '/about'];

export default function PublicLayout() {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const isFullBleed = FULL_BLEED_PAGES.includes(location.pathname);

  return (
    <div style={{ minHeight: '100vh' }}>
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
