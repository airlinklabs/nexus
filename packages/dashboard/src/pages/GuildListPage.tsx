import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, type Guild } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.js';
import { Card, Button, EmptyState, SkeletonCard } from '../components/ui/index.js';

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
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              Log out
            </Button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          Your servers
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-mid)', marginBottom: 'var(--space-6)' }}>
          Select a server to configure Nexus.
        </p>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {error !== null && (
          <Card>
            <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>{error}</p>
          </Card>
        )}

        {!loading && error === null && guilds.length === 0 && (
          <Card>
            <EmptyState
              title="No servers found"
              description="Make sure Nexus is invited to a server you administrate."
              action={
                <a
                  href={`https://discord.com/oauth2/authorize?client_id=${import.meta.env['VITE_DISCORD_CLIENT_ID'] ?? 'YOUR_CLIENT_ID'}&scope=bot&permissions=8`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button>Invite Nexus to your server</Button>
                </a>
              }
            />
          </Card>
        )}

        {!loading && error === null && guilds.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {guilds.map((guild) => (
              <Link
                key={guild.id}
                to={`/dashboard/${guild.id}`}
                style={{ textDecoration: 'none' }}
              >
                <Card
                  padding="md"
                  style={{
                    cursor: 'pointer',
                    transition: 'border-color var(--duration-fast) var(--ease-out)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {guild.icon !== null ? (
                      <img
                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                        alt=""
                        width={36}
                        height={36}
                        style={{ borderRadius: 'var(--radius-sm)' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--ink-low)',
                        }}
                      >
                        {guild.name.charAt(0)}
                      </div>
                    )}
                    <span style={{ flex: 1, fontWeight: 500, color: 'var(--ink-high)' }}>
                      {guild.name}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                      Configure →
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
