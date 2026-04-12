import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ConsumerGuard, PharmacyGuard, AdminGuard } from './router/guards';
import PublicLayout from './layouts/PublicLayout';
import PharmacyLayout from './layouts/PharmacyLayout';
import AdminLayout from './layouts/AdminLayout';
import ConsumerLayout from './layouts/ConsumerLayout';
import ToastContainer from './components/ui/ToastContainer';
import ScrollToTop from './components/ui/ScrollToTop';

// ── Inline imports for lightweight/always-needed pages ──
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import NotFound from './pages/NotFound';

// ── Lazy imports — split by portal ──
// Public
const About          = lazy(() => import('./pages/public/About'));
const HowItWorks     = lazy(() => import('./pages/public/HowItWorks'));
const ForPharmacies  = lazy(() => import('./pages/public/ForPharmacies'));
const ConsumerSignup = lazy(() => import('./pages/public/ConsumerSignup'));

// Pharmacy
const PharmacyRegister      = lazy(() => import('./pages/pharmacy/PharmacyRegister'));
const PharmacyPending       = lazy(() => import('./pages/pharmacy/PharmacyPending'));
const PharmacySuspended     = lazy(() => import('./pages/pharmacy/PharmacySuspended'));
const PharmacyDashboard     = lazy(() => import('./pages/pharmacy/PharmacyDashboard'));
const PharmacyInventory     = lazy(() => import('./pages/pharmacy/PharmacyInventory'));
const ExpiryAlerts          = lazy(() => import('./pages/pharmacy/ExpiryAlerts'));
const PharmacyOrders        = lazy(() => import('./pages/pharmacy/PharmacyOrders'));
const PharmacyAnalytics     = lazy(() => import('./pages/pharmacy/PharmacyAnalytics'));
const PharmacyPricing       = lazy(() => import('./pages/pharmacy/PharmacyPricing'));
const PharmacyStoreProfile  = lazy(() => import('./pages/pharmacy/PharmacyStoreProfile'));
const PharmacyNotifications = lazy(() => import('./pages/pharmacy/PharmacyNotifications'));

// Admin
const AdminDashboard         = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminPharmacies        = lazy(() => import('./pages/admin/AdminPharmacies'));
const AdminApplicationReview = lazy(() => import('./pages/admin/AdminApplicationReview'));
const AdminMedicines         = lazy(() => import('./pages/admin/AdminMedicines'));
const AdminOrders            = lazy(() => import('./pages/admin/AdminOrders'));
const AdminAnalytics         = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminComplaints        = lazy(() => import('./pages/admin/AdminComplaints'));
const AdminUsers             = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSettings          = lazy(() => import('./pages/admin/AdminSettings'));
const AdminNotifications     = lazy(() => import('./pages/admin/AdminNotifications'));

// Consumer
const ConsumerHome          = lazy(() => import('./pages/consumer/ConsumerHome'));
const ConsumerStores        = lazy(() => import('./pages/consumer/ConsumerStores'));
const StoreProfile          = lazy(() => import('./pages/consumer/StoreProfile'));
const MedicineBrowse        = lazy(() => import('./pages/consumer/MedicineBrowse'));
const MedicineDetail        = lazy(() => import('./pages/consumer/MedicineDetail'));
const Cart                  = lazy(() => import('./pages/consumer/Cart'));
const Checkout              = lazy(() => import('./pages/consumer/Checkout'));
const MyOrders              = lazy(() => import('./pages/consumer/MyOrders'));
const ConsumerNotifications = lazy(() => import('./pages/consumer/ConsumerNotifications'));
const OrderTracking         = lazy(() => import('./pages/consumer/OrderTracking'));
const ConsumerProfile       = lazy(() => import('./pages/consumer/ConsumerProfile'));

// ── Suspense fallback ──
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid var(--green-200)',
        borderTopColor: 'var(--green-700)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public ── */}
          <Route element={<PublicLayout />}>
            <Route path="/"               element={<Landing />} />
            <Route path="/login"          element={<Login />} />
            <Route path="/about"          element={<About />} />
            <Route path="/how-it-works"   element={<HowItWorks />} />
            <Route path="/for-pharmacies" element={<ForPharmacies />} />
            <Route path="/signup"         element={<ConsumerSignup />} />
          </Route>

          {/* ── Pharmacy onboarding / status pages (no auth guard needed) ── */}
          <Route path="/pharmacy/register"  element={<PharmacyRegister />} />
          <Route path="/pharmacy/pending"   element={<PharmacyPending />} />
          {/* ADDED: Suspended route lives outside PharmacyGuard so a suspended
              owner can reach it — the guard redirects them here, not into the
              dashboard. */}
          <Route path="/pharmacy/suspended" element={<PharmacySuspended />} />

          {/* ── Pharmacy dashboard (approved owners only) ── */}
          <Route path="/pharmacy" element={<PharmacyGuard><PharmacyLayout /></PharmacyGuard>}>
            <Route index element={<Navigate to="/pharmacy/dashboard" replace />} />
            <Route path="dashboard"        element={<PharmacyDashboard />} />
            <Route path="inventory"        element={<PharmacyInventory />} />
            <Route path="inventory/expiry" element={<ExpiryAlerts />} />
            <Route path="orders"           element={<PharmacyOrders />} />
            <Route path="analytics"        element={<PharmacyAnalytics />} />
            <Route path="pricing"          element={<PharmacyPricing />} />
            <Route path="profile"          element={<PharmacyStoreProfile />} />
            <Route path="notifications"    element={<PharmacyNotifications />} />
          </Route>

          {/* ── Admin panel ── */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard"       element={<AdminDashboard />} />
            <Route path="pharmacies"      element={<AdminPharmacies />} />
            <Route path="pharmacies/:id"  element={<AdminApplicationReview />} />
            <Route path="medicines"       element={<AdminMedicines />} />
            <Route path="orders"          element={<AdminOrders />} />
            <Route path="analytics"       element={<AdminAnalytics />} />
            <Route path="complaints"      element={<AdminComplaints />} />
            <Route path="users"           element={<AdminUsers />} />
            <Route path="settings"        element={<AdminSettings />} />
            <Route path="notifications"   element={<AdminNotifications />} />
          </Route>

          {/* ── Consumer portal ── */}
          <Route path="/consumer" element={<ConsumerGuard><ConsumerLayout /></ConsumerGuard>}>
            <Route index element={<Navigate to="/consumer/home" replace />} />
            <Route path="home"                   element={<ConsumerHome />} />
            <Route path="stores"                 element={<ConsumerStores />} />
            <Route path="stores/:storeId"        element={<StoreProfile />} />
            <Route path="medicines"              element={<MedicineBrowse />} />
            <Route path="medicines/:medicineId"  element={<MedicineDetail />} />
            <Route path="cart"                   element={<Cart />} />
            <Route path="checkout"               element={<Checkout />} />
            <Route path="orders"                 element={<MyOrders />} />
            <Route path="orders/:orderId"        element={<OrderTracking />} />
            <Route path="profile"                element={<ConsumerProfile />} />
            <Route path="notifications"          element={<ConsumerNotifications />} />
          </Route>

          {/* ── 404 ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <ToastContainer />
    </BrowserRouter>
  );
}
