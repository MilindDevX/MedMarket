import { Component } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, send to error reporting service
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--neutral-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-6)',
      }}>
        <motion.div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-200)',
            borderRadius: 20,
            padding: 'var(--sp-10)',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div style={{
            width: 64, height: 64,
            borderRadius: '50%',
            background: 'var(--warning-light)',
            color: 'var(--warning)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--sp-5)',
          }}>
            <AlertTriangle size={28} strokeWidth={1.5} />
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--ink-900)',
            letterSpacing: '-0.3px',
            marginBottom: 'var(--sp-3)',
          }}>
            Something went wrong
          </h1>

          <p style={{
            fontSize: 14,
            color: 'var(--ink-500)',
            lineHeight: 1.7,
            marginBottom: 'var(--sp-6)',
          }}>
            An unexpected error occurred on this page. The error has been logged.
            Try refreshing the page or going back to the home screen.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <details style={{
              background: 'var(--ink-50)',
              border: '1px solid var(--ink-200)',
              borderRadius: 8,
              padding: 'var(--sp-3)',
              marginBottom: 'var(--sp-5)',
              textAlign: 'left',
            }}>
              <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', cursor: 'pointer', userSelect: 'none' }}>
                Error details (dev only)
              </summary>
              <pre style={{ fontSize: 11, color: 'var(--danger)', marginTop: 8, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error?.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReset}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 20px',
                background: 'var(--green-700)', color: 'var(--white)',
                border: 'none', borderRadius: 'var(--r-md)',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <RefreshCw size={15} strokeWidth={2} /> Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 20px',
                background: 'var(--white)', color: 'var(--ink-700)',
                border: '1px solid var(--ink-200)', borderRadius: 'var(--r-md)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Home size={15} strokeWidth={2} /> Go Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
}
