/**
 * api.js utility — unit tests
 *
 * Tests the key behaviours:
 *   - Attaches Authorization header when token exists
 *   - Throws on 401 for auth endpoints (no refresh attempt)
 *   - Silently refreshes token on 401 for non-auth endpoints
 *   - Dispatches auth:logout when refresh fails
 *   - Throws on 403, 404, 409, and generic errors
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Stub sessionStorage ──────────────────────────────────────────────────────
const _storage = {};
vi.stubGlobal('sessionStorage', {
  getItem:    (k) => _storage[k] ?? null,
  setItem:    (k, v) => { _storage[k] = String(v); },
  removeItem: (k) => { delete _storage[k]; },
});

// ── Stub window.dispatchEvent ────────────────────────────────────────────────
vi.stubGlobal('dispatchEvent', vi.fn());

// ── Stub fetch ───────────────────────────────────────────────────────────────
vi.stubGlobal('fetch', vi.fn());

function mockFetch(status, body) {
  fetch.mockResolvedValueOnce({
    ok:     status >= 200 && status < 300,
    status,
    json:   () => Promise.resolve(body),
  });
}

// ── Import AFTER stubs are set up ────────────────────────────────────────────
const { api, saveTokens, clearTokens } = await import('../utils/api.js');

describe('api utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTokens();
    Object.keys(_storage).forEach(k => delete _storage[k]);
  });

  it('sends request without Authorization when not logged in', async () => {
    mockFetch(200, { success: true, data: [] });
    await api.get('/medicines');
    const headers = fetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('attaches Bearer token when access token is present', async () => {
    saveTokens('my-access-token', null);
    mockFetch(200, { success: true, data: [] });
    await api.get('/medicines');
    const headers = fetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe('Bearer my-access-token');
  });

  it('returns data on 200', async () => {
    mockFetch(200, { success: true, data: { id: '1' } });
    const result = await api.get('/medicines/1');
    expect(result.data.id).toBe('1');
  });

  it('throws immediately on 401 for auth endpoints (no refresh attempt)', async () => {
    mockFetch(401, { message: 'Invalid credentials.' });
    await expect(api.post('/auth/login', { email: 'x', password: 'wrong' }))
      .rejects.toThrow('Invalid credentials.');
    // fetch should only be called once (no retry)
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('throws on 403 with server message', async () => {
    mockFetch(403, { message: 'Access denied.' });
    await expect(api.get('/admin/dashboard')).rejects.toThrow('Access denied.');
  });

  it('throws on 404', async () => {
    mockFetch(404, { message: 'Not found: /orders/xyz.' });
    await expect(api.get('/orders/xyz')).rejects.toThrow(/not found/i);
  });

  it('throws on 409 conflict', async () => {
    mockFetch(409, { message: 'Already exists.' });
    await expect(api.post('/pharmacy/register', {})).rejects.toThrow('Already exists.');
  });

  it('attempts token refresh on 401 for non-auth endpoint', async () => {
    saveTokens('expired-token', 'valid-refresh-token');
    // First call: 401 on the original request
    mockFetch(401, { message: 'Invalid or expired token' });
    // Second call: successful refresh
    mockFetch(200, { data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
    // Third call: retry of original request
    mockFetch(200, { success: true, data: { id: '1' } });

    const result = await api.get('/consumer/addresses');
    expect(result.data.id).toBe('1');
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('dispatches auth:logout when refresh also fails', async () => {
    saveTokens('expired-token', 'also-expired-refresh');
    // First call: 401
    mockFetch(401, { message: 'Expired' });
    // Refresh call: also fails
    mockFetch(401, { message: 'Refresh expired' });

    await expect(api.get('/consumer/addresses')).rejects.toThrow(/session expired/i);
    expect(window.dispatchEvent).toHaveBeenCalled();
  });
});
