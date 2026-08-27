import { create } from 'zustand';
import { api, saveTokens, clearTokens, saveUser, getTokens } from '../utils/api';

function friendlyLoginError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('deactivat') || m.includes('disabled') || m.includes('inactive') || m.includes('suspended')) {
    return 'DEACTIVATED';
  }
  return msg || 'Login failed. Please try again.';
}

const useAuthStore = create((set, get) => ({
  user:            null,
  role:            null,
  isAuthenticated: false,
  pharmacyStatus:  null,
  loading:         false,
  hydrating:       true,   // true until hydrate() resolves — prevents flash-of-unauthenticated
  error:           null,

  _fetchPharmacyStatus: async () => {
    try {
      const res = await api.get('/pharmacy/me');
      if (res.data?.status) {
        set({ pharmacyStatus: res.data.status });
        const user = get().user;
        if (user) {
          const updated = { ...user, pharmacyStatus: res.data.status };
          saveUser(updated);
          set({ user: updated });
        }
      }
    } catch {
      set({ pharmacyStatus: 'pending' });
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', data);
      saveTokens(res.data.accessToken, res.data.refreshToken);
      saveUser(res.data.user);
      set({ user: res.data.user, role: res.data.user.role, isAuthenticated: true, pharmacyStatus: null, loading: false });
      if (res.data.user.role === 'pharmacy_owner') await get()._fetchPharmacyStatus();
      return res.data.user;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      clearTokens();
      const res = await api.post('/auth/login', { email, password });
      saveTokens(res.data.accessToken, res.data.refreshToken);
      saveUser(res.data.user);
      set({ user: res.data.user, role: res.data.user.role, isAuthenticated: true, pharmacyStatus: null, loading: false });
      if (res.data.user.role === 'pharmacy_owner') await get()._fetchPharmacyStatus();
      return res.data.user;
    } catch (err) {
      const msg = friendlyLoginError(err.message);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  googleLogin: async (idToken, role) => {
    set({ loading: true, error: null });
    try {
      clearTokens();
      const res = await api.post('/auth/google', { idToken, role });
      saveTokens(res.data.accessToken, res.data.refreshToken);
      saveUser(res.data.user);
      set({ user: res.data.user, role: res.data.user.role, isAuthenticated: true, pharmacyStatus: null, loading: false });
      if (res.data.user.role === 'pharmacy_owner') await get()._fetchPharmacyStatus();
      return { user: res.data.user, isNew: res.data.isNew === true };
    } catch (err) {
      const msg = friendlyLoginError(err.message);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      const { refreshToken } = getTokens();
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch { } finally {
      clearTokens();
      set({ user: null, role: null, isAuthenticated: false, pharmacyStatus: null });
    }
  },

  setPharmacyStatus: (status) => {
    set({ pharmacyStatus: status });
    const user = get().user;
    if (user) {
      const updated = { ...user, pharmacyStatus: status };
      saveUser(updated);
      set({ user: updated });
    }
  },

  // ── Async hydrate ─────────────────────────────────────────────────────────
  // On page load we check the stored access token. If it's expired but a
  // refresh token is present, we proactively refresh before rendering the app.
  // This eliminates the "logged-out flash" on hard refresh.
  hydrate: async () => {
    const { accessToken, refreshToken } = getTokens();
    const stored = localStorage.getItem('user');

    // Nothing stored — user was never logged in
    if (!accessToken && !refreshToken) {
      set({ hydrating: false });
      return;
    }

    if (accessToken && stored) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const isExpired = payload.exp && payload.exp * 1000 < Date.now();

        if (!isExpired) {
          // Token is still valid — restore session immediately
          const user = JSON.parse(stored);
          set({ user, role: user.role, isAuthenticated: true, pharmacyStatus: user.pharmacyStatus || null, hydrating: false });
          // Refresh pharmacy status in background — don't block render
          if (user.role === 'pharmacy_owner') setTimeout(() => get()._fetchPharmacyStatus(), 100);
          return;
        }
      } catch {
        // Malformed token — fall through to refresh attempt
      }
    }

    // Access token is expired (or missing) — try refresh before giving up
    if (refreshToken) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/refresh`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refreshToken }),
        });
        if (res.ok) {
          const data = await res.json();
          const { saveTokens: save, saveUser: saveU } = await import('../utils/api');
          save(data.data.accessToken, data.data.refreshToken);
          // Fetch fresh user profile with the new token
          const profileRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/me`, {
            headers: { Authorization: `Bearer ${data.data.accessToken}` },
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            const user = profile.data || profile;
            saveU(user);
            set({ user, role: user.role, isAuthenticated: true, pharmacyStatus: user.pharmacyStatus || null, hydrating: false });
            if (user.role === 'pharmacy_owner') setTimeout(() => get()._fetchPharmacyStatus(), 100);
            return;
          }
        }
      } catch {
        // Refresh failed — fall through to clear
      }
    }

    // All attempts failed — clear stale tokens silently
    clearTokens();
    set({ hydrating: false });
  },
}));

// ── Global auth:logout listener ───────────────────────────────────────────────
// Dispatched by api.js when refresh fails. Carries { from } for deep-link restore.
window.addEventListener('auth:logout', async (e) => {
  const from = e.detail?.from || null;
  await useAuthStore.getState().logout();
  // Navigate to login with session-expiry flag and the originating path
  // Using a CustomEvent re-dispatch so Login.jsx can read location.state via router
  window.dispatchEvent(new CustomEvent('auth:navigate-login', { detail: { from, sessionExpired: true } }));
});

export default useAuthStore;
