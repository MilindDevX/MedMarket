const BASE_URL = import.meta.env.API_URL || 'http://localhost:3000/api/v1';

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

async function request(endpoint, options = {}) {
  const { accessToken } = getTokens();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  const data = await res.json().catch(() => ({ message: 'Server returned an unexpected response.' }));

  if (res.status === 403) {
    throw new Error(data.message || 'Access denied. You do not have permission for this action.');
  }

  if (res.status === 401) {
    const msg = (data.message || '').toLowerCase();
    if (msg.includes('deactivate') || msg.includes('disabled') || msg.includes('inactive')) {
      throw new Error(data.message);
    }
    // Token expired — attempt silent refresh
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
    throw new Error(data.message || `Endpoint not found: ${endpoint}.`);
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
