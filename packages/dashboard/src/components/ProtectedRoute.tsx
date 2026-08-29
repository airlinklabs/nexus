import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';

export function ProtectedRoute() {
  const { auth } = useAuth();

  if (auth.status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-base)',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            animation: 'pulse-subtle 1.5s ease-in-out infinite',
          }} />
          <span style={{
            color: 'var(--ink-low)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
          }}>
            Loading…
          </span>
        </div>
      </div>
    );
  }

  if (auth.status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
