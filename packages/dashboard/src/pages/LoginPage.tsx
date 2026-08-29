import { api } from '../api/client.js';

export function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(oklch(72% 0.14 170 / 6%) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
      }} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        position: 'relative',
      }}>
        {/* Logo mark */}
        <div className="animate-in" style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-6)',
          boxShadow: 'var(--shadow-glow)',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            color: 'var(--bg-base)',
          }}>N</span>
        </div>

        {/* Heading */}
        <div className="animate-in" style={{ animationDelay: '60ms', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--ink-high)',
            letterSpacing: '-0.03em',
            marginBottom: 'var(--space-2)',
          }}>
            nexus
          </h1>
          <p style={{
            color: 'var(--ink-mid)',
            fontSize: 'var(--text-base)',
            maxWidth: 380,
            lineHeight: 1.6,
          }}>
            Build interactive Discord UIs without writing code.
          </p>
        </div>

        {/* Login button */}
        <a
          href={api.auth.loginUrl()}
          className="animate-in"
          style={{
            animationDelay: '120ms',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: '12px 28px',
            background: 'var(--accent)',
            color: 'var(--bg-base)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-md), var(--shadow-glow)',
            transition: 'all var(--duration-fast) var(--ease-out)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-dim)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg), var(--shadow-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md), var(--shadow-glow)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
          </svg>
          Log in with Discord
        </a>

        {/* Features */}
        <div
          className="stagger"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-4)',
            maxWidth: 560,
            width: '100%',
            marginTop: 'var(--space-12)',
          }}
        >
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              ),
              title: 'Templates',
              desc: 'Pre-built UIs for polls, tickets, feedback, and more.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              ),
              title: 'Slash Commands',
              desc: 'Deploy UIs with /ui use template:name instantly.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              ),
              title: 'Access Control',
              desc: 'Role-based permissions for who can create and interact.',
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className="animate-in"
              style={{
                animationDelay: `${180 + i * 60}ms`,
                padding: 'var(--space-5)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{
                color: 'var(--accent)',
                marginBottom: 'var(--space-3)',
              }}>
                {f.icon}
              </div>
              <h3 style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--ink-high)',
                marginBottom: 'var(--space-1)',
              }}>
                {f.title}
              </h3>
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--ink-mid)',
                lineHeight: 1.5,
              }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        padding: 'var(--space-4)',
        textAlign: 'center',
        fontSize: 'var(--text-xs)',
        color: 'var(--ink-faint)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)' }}>nexus</span> — open-source Discord UI builder
      </footer>
    </div>
  );
}
