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
          const msg = err instanceof ApiError ? err.message : 'Failed to load servers.';
          setError(msg);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const user = auth.status === 'authenticated' ? auth.user : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-6)',
        background: 'oklch(14% 0.008 250 / 80%)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link to="/dashboard" style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 'var(--text-base)',
          color: 'var(--ink-high)',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--bg-base)' }}>N</span>
          </div>
          nexus
        </Link>
        {user !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {user.avatar !== null && (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png?size=32`}
                  alt=""
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
              )}
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-mid)' }}>{user.username}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>Log out</Button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        {/* Page header */}
        <div className="animate-in" style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
        }}>
          <div>
            <h1 style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              color: 'var(--ink-high)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-1)',
            }}>
              Your servers
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-mid)' }}>
              Select a server to configure Nexus.
            </p>
          </div>
          <a
            href={`https://discord.com/oauth2/authorize?client_id=${import.meta.env['VITE_DISCORD_CLIENT_ID'] ?? 'YOUR_CLIENT_ID'}&permissions=8&scope=bot%20applications.commands`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <Button variant="accent" size="sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Invite Bot
            </Button>
          </a>
        </div>

        {/* Loading */}
        {loading && (
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {error !== null && (
          <Card>
            <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>{error}</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && error === null && guilds.length === 0 && (
          <Card>
            <EmptyState
              title="No servers found"
              description="Nexus isn't in any servers you have access to yet. Invite it to get started."
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              }
              action={
                <a
                  href={`https://discord.com/oauth2/authorize?client_id=${import.meta.env['VITE_DISCORD_CLIENT_ID'] ?? 'YOUR_CLIENT_ID'}&permissions=8&scope=bot%20applications.commands`}
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

        {/* Guild list */}
        {!loading && error === null && guilds.length > 0 && (
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {guilds.map((guild) => (
              <Link key={guild.id} to={`/dashboard/${guild.id}`} style={{ textDecoration: 'none' }}>
                <Card padding="md" hover>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {guild.icon !== null ? (
                      <img
                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`}
                        alt=""
                        width={40}
                        height={40}
                        style={{ borderRadius: 'var(--radius-md)' }}
                      />
                    ) : (
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        color: 'var(--accent)',
                      }}>
                        {guild.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontWeight: 600,
                        color: 'var(--ink-high)',
                        fontSize: 'var(--text-sm)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {guild.name}
                      </span>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--ink-faint)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
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
