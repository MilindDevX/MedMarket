const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// ── Token storage (localStorage — survives tab close, aligns with auth) ──────
export function getTokens() {
  return {
    accessToken:  localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
}

export function saveTokens(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function saveUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// ── Single-flight refresh ─────────────────────────────────────────────────────
// Multiple concurrent 401s share ONE refresh call instead of firing N parallel
// refreshes, which would cause the second+ calls to fail (token already rotated).
let refreshPromise = null;

async function refreshAccessToken() {
  // If a refresh is already in-flight, join it instead of starting a new one
  if (refreshPromise) return refreshPromise;

  const { refreshToken } = getTokens();
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken }),
      });
      if (!res.ok) { clearTokens(); return null; }
      const data = await res.json();
      saveTokens(data.data.accessToken, data.data.refreshToken);
      return data.data.accessToken;
    } catch {
      clearTokens();
      return null;
    }
  })().finally(() => {
    // Clear the in-flight promise regardless of outcome so future calls start fresh
    refreshPromise = null;
  });

  return refreshPromise;
}

// Auth endpoints must never trigger the 401-refresh retry — a 401 on /auth/login
// means wrong password, not an expired token.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

async function request(endpoint, options = {}) {
  const { accessToken } = getTokens();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res  = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({ message: 'Server returned an unexpected response.' }));

  if (res.status === 403) {
    throw new Error(data.message || 'Access denied.');
  }

  if (res.status === 401) {
    // Never retry auth endpoints — wrong password IS a 401, not a stale token
    if (AUTH_ENDPOINTS.some(e => endpoint.startsWith(e))) {
      throw new Error(data.message || 'Invalid credentials.');
    }
    const msg = (data.message || '').toLowerCase();
    if (msg.includes('deactivat') || msg.includes('disabled') || msg.includes('inactive')) {
      throw new Error(data.message);
    }

    // Single-flight refresh — all parallel 401s share one refresh call
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes  = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
      const retryData = await retryRes.json().catch(() => ({ message: 'Server error.' }));
      if (!retryRes.ok) throw new Error(retryData.message || 'Something went wrong');
      return retryData;
    } else {
      // Carry the current path so Login.jsx can deep-link restore after re-auth
      const from = window.location.pathname + window.location.search;
      window.dispatchEvent(new CustomEvent('auth:logout', { detail: { from } }));
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (res.status === 404) {
    throw new Error(data.message || `Not found: ${endpoint}.`);
  }

  if (res.status === 409) {
    throw new Error(data.message || 'Already exists.');
  }

  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// All HTTP verbs — put added for full-resource updates
export const api = {
  get:    (endpoint)       => request(endpoint, { method: 'GET' }),
  post:   (endpoint, body) => request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (endpoint, body) => request(endpoint, { method: 'PATCH',  body: JSON.stringify(body) }),
  put:    (endpoint, body) => request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (endpoint)       => request(endpoint, { method: 'DELETE' }),
};
