import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles/global.css';
import App from './App';
import ErrorBoundary from './components/ui/ErrorBoundary';
import useAuthStore from './store/authStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ── Async hydrate root ────────────────────────────────────────────────────────
// We await hydrate() before rendering so the app never flashes the login screen
// for users who are already authenticated (prevents race with route guards).
function Root() {
  const hydrating = useAuthStore(s => s.hydrating);

  // Render nothing (or a minimal spinner) until session is resolved
  if (hydrating) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F1F0EA',
      }}>
        <div style={{
          width: 24, height: 24,
          border: '2.5px solid #A8D9C8',
          borderTopColor: '#0C6B4E',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

// Kick off hydration (async) — the Root component watches hydrating state
useAuthStore.getState().hydrate();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
