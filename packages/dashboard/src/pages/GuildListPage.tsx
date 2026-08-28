import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, type Guild } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.js';

export function GuildListPage() {
  const { auth, logout } = useAuth();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.guilds
      .list()
      .then((res) => {
        if (!cancelled) {
          setGuilds(res.guilds);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err instanceof ApiError ? err.message : 'Failed to load servers.';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const user = auth.status === 'authenticated' ? auth.user : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--ink-high)',
          }}
        >
          nexus
        </span>
        {user !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {user.avatar !== null && (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png`}
                  alt=""
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
              )}
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-mid)' }}>
                {user.username}
              </span>
            </div>
            <button
              onClick={() => {
                void logout();
              }}
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--ink-low)',
                padding: 'var(--space-1) var(--space-2)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Log out
            </button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            marginBottom: 'var(--space-6)',
          }}
        >
          Your servers
        </h2>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 56,
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              />
            ))}
          </div>
        )}

        {error !== null && (
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {error}
          </div>
        )}

        {!loading && error === null && guilds.length === 0 && (
          <div
            style={{
              padding: 'var(--space-8)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              textAlign: 'center',
              color: 'var(--ink-mid)',
              fontSize: 'var(--text-sm)',
            }}
          >
            <p>No servers found.</p>
            <p style={{ marginTop: 'var(--space-2)' }}>
              Make sure Nexus is invited to a server you administrate.
            </p>
            <a
              href="https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=8"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: 'var(--space-4)',
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--accent)',
                color: 'var(--bg-base)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Invite Nexus to your server
            </a>
          </div>
        )}

        {!loading && error === null && guilds.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {guilds.map((guild) => (
              <Link
                key={guild.id}
                to={`/dashboard/${guild.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-4)',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--ink-high)',
                  transition: 'border-color var(--duration-fast) var(--ease-out)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                {guild.icon !== null ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                    alt=""
                    width={32}
                    height={32}
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--ink-low)',
                    }}
                  >
                    {guild.name.charAt(0)}
                  </div>
                )}
                <span style={{ flex: 1, fontWeight: 500 }}>{guild.name}</span>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--ink-faint)',
                  }}
                >
                  Configure →
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
