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
      return res.data.user;
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

  hydrate: () => {
    const { accessToken } = getTokens();
    const stored = sessionStorage.getItem('user');
    if (accessToken && stored) {
      try {
        const user = JSON.parse(stored);
        set({ user, role: user.role, isAuthenticated: true, pharmacyStatus: user.pharmacyStatus || null });
        if (user.role === 'pharmacy_owner') setTimeout(() => get()._fetchPharmacyStatus(), 100);
      } catch { clearTokens(); }
    }
  },
}));

window.addEventListener('auth:logout', () => { useAuthStore.getState().logout(); });

export default useAuthStore;
