import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export function ConsumerGuard({ children }) {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated || role !== 'consumer') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export function PharmacyGuard({ children }) {
  const { isAuthenticated, role, pharmacyStatus } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || role !== 'pharmacy_owner') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Pending and rejected pharmacies go to the review-waiting screen.
  // They haven't been approved yet, so they can't access the dashboard.
  if (pharmacyStatus === 'pending' || pharmacyStatus === 'rejected') {
    return <Navigate to="/pharmacy/pending" replace />;
  }

  if (pharmacyStatus === 'suspended') {
    return <Navigate to="/pharmacy/suspended" replace />;
  }

  return children;
}

export function AdminGuard({ children }) {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated || role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
