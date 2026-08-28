import { api } from '../api/client.js';

export function LoginPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 'var(--space-6)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 600,
            color: 'var(--ink-high)',
            letterSpacing: '-0.02em',
          }}
        >
          nexus
        </h1>
        <p
          style={{
            color: 'var(--ink-mid)',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--space-2)',
          }}
        >
          Manage your Discord server's UI configuration.
        </p>
      </div>

      <a
        href={api.auth.loginUrl()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-6)',
          background: 'var(--accent)',
          color: 'var(--bg-base)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 500,
          fontSize: 'var(--text-sm)',
          textDecoration: 'none',
          transition: 'background var(--duration-fast) var(--ease-out)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-dim)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--accent)';
        }}
      >
        Log in with Discord
      </a>
    </div>
  );
}
