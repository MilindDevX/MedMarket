const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export function getTokens() {
  return {
    accessToken:  sessionStorage.getItem('accessToken'),
    refreshToken: sessionStorage.getItem('refreshToken'),
  };
}

export function saveTokens(accessToken, refreshToken) {
  sessionStorage.setItem('accessToken', accessToken);
  if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
}

export function saveUser(user) {
  sessionStorage.setItem('user', JSON.stringify(user));
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) return null;
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
    if (AUTH_ENDPOINTS.some(e => endpoint.startsWith(e))) {
      throw new Error(data.message || 'Invalid credentials.');
    }
    const msg = (data.message || '').toLowerCase();
    if (msg.includes('deactivat') || msg.includes('disabled') || msg.includes('inactive')) {
      throw new Error(data.message);
    }
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes  = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
      const retryData = await retryRes.json().catch(() => ({ message: 'Server error.' }));
      if (!retryRes.ok) throw new Error(retryData.message || 'Something went wrong');
      return retryData;
    } else {
      window.dispatchEvent(new Event('auth:logout'));
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

export const api = {
  get:    (endpoint)       => request(endpoint, { method: 'GET' }),
  post:   (endpoint, body) => request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (endpoint, body) => request(endpoint, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (endpoint)       => request(endpoint, { method: 'DELETE' }),
};
