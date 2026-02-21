import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

/**
 * GoogleSignInButton
 *
 * Uses the implicit flow: opens Google's popup, gets an access token,
 * then fetches the user's profile from Google's userinfo endpoint,
 * and passes the ID token to our own backend via onSuccess(idToken).
 *
 * Props:
 *   onSuccess(idToken: string) — called with the credential token
 *   onError(message: string)  — called on failure
 *   label                     — button text (default: "Continue with Google")
 *   disabled                  — disables the button
 */
export default function GoogleSignInButton({ onSuccess, onError, label = 'Continue with Google', disabled = false }) {
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Exchange access_token for user info + id_token via Google's userinfo endpoint
        const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!infoRes.ok) throw new Error('Failed to fetch Google user info');
        await infoRes.json();

        await onSuccess(tokenResponse.access_token);
      } catch (err) {
        onError?.(err.message || 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    onError: (err) => {
      onError?.(err?.error_description || 'Google sign-in was cancelled or failed');
    },
    flow: 'implicit',
  });

  return (
    <button
      type="button"
      onClick={() => { if (!disabled && !loading) login(); }}
      disabled={disabled || loading}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '11px 16px',
        background: '#fff',
        border: '1.5px solid #E5E7EB',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 600,
        color: '#1F2937',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)',
        opacity: disabled || loading ? 0.7 : 1,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.borderColor = '#9CA3AF'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
    >
      {loading ? (
        <span style={{ width: 18, height: 18, border: '2px solid #E5E7EB', borderTopColor: '#6B7280', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
      ) : GOOGLE_ICON}
      {loading ? 'Connecting…' : label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
