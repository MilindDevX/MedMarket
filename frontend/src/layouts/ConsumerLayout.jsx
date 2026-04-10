import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ConsumerNav from '../components/consumer/ConsumerNav';
import PageTransition from '../components/ui/PageTransition';

export default function ConsumerLayout() {
  const location = useLocation();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--neutral-bg)', paddingBottom: '80px' }}>
      <ConsumerNav />
      <main style={{ paddingTop: 60 }}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
  );
}
