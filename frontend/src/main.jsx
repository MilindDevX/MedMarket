import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';
import ErrorBoundary from './components/ui/ErrorBoundary';
import useAuthStore from './store/authStore';

// Restore session from localStorage on startup
useAuthStore.getState().hydrate();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
