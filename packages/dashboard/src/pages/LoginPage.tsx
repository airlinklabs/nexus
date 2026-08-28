import { api } from '../api/client.js';
import { Card } from '../components/ui/index.js';

export function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 'var(--space-6)',
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <h1
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 600,
              color: 'var(--ink-high)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-2)',
            }}
          >
            nexus
          </h1>
          <p
            style={{
              color: 'var(--ink-mid)',
              fontSize: 'var(--text-lg)',
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            Build interactive UIs in Discord without writing code.
          </p>
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
              marginTop: 'var(--space-6)',
              transition: 'background var(--duration-fast) var(--ease-out)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-dim)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            Log in with Discord
          </a>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', maxWidth: 640, width: '100%' }}>
          <Card padding="lg">
            <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>🎨</div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
              Templates
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
              Pre-built UIs for polls, tickets, feedback, and more. Just fill in the blanks.
            </p>
          </Card>

          <Card padding="lg">
            <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>⚡</div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
              Slash Commands
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
              Use <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>/ui use</code> to deploy UIs instantly.
            </p>
          </Card>

          <Card padding="lg">
            <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>🔒</div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
              Role-Based Access
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
              Control who can create and interact with UIs using Discord roles.
            </p>
          </Card>
        </div>

        {/* How it works */}
        <div style={{ marginTop: 'var(--space-12)', maxWidth: 480, textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
            How it works
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>1</span>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-mid)' }}>
                Invite Nexus to your Discord server
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>2</span>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-mid)' }}>
                Create templates in the dashboard or use built-in ones
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>3</span>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-mid)' }}>
                Deploy with <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>/ui use template:poll question="Best language?"</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
