import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiError, type LogEntry } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.js';
import { Card, Badge, Button, EmptyState } from '../components/ui/index.js';

const TYPE_BADGE: Record<string, 'info' | 'success' | 'warning'> = {
  button: 'info',
  select: 'success',
  modal: 'warning',
};

export function InteractionLogPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { logout } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (guildId === undefined) return;
    let cancelled = false;
    api.messages.log(guildId, 50)
      .then((res) => { if (!cancelled) { setEntries(res.log); setLoading(false); } })
      .catch((err: unknown) => { if (!cancelled) { setError(err instanceof ApiError ? err.message : 'Failed to load log.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [guildId]);

  const loadMore = async () => {
    if (guildId === undefined || entries.length === 0) return;
    try {
      const res = await api.messages.log(guildId, 50);
      const newEntries = res.log.filter((e) => !entries.some((x) => x.id === e.id));
      setEntries((prev) => [...prev, ...newEntries]);
    } catch { /* silently fail */ }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-6)',
        background: 'oklch(14% 0.008 250 / 80%)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link to={`/dashboard/${guildId}`} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
            color: 'var(--ink-low)', fontSize: 'var(--text-sm)', textDecoration: 'none',
            transition: 'color var(--duration-fast) var(--ease-out)',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-high)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-low)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Config
          </Link>
          <span style={{ color: 'var(--ink-faint)', fontSize: 'var(--text-sm)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink-high)', fontSize: 'var(--text-sm)' }}>Activity</span>
        </div>
        <button onClick={() => void logout()} style={{
          fontSize: 'var(--text-xs)', color: 'var(--ink-low)',
          padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)',
          transition: 'color var(--duration-fast) var(--ease-out)',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-low)'; }}
        >Log out</button>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        <div className="animate-in" style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-1)' }}>Interaction log</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-mid)' }}>Track all component interactions across your server.</p>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{
                height: 44, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                animation: `shimmer 1.5s ease-in-out infinite`,
                backgroundSize: '200% 100%',
                backgroundImage: `linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-elevated) 50%, var(--bg-surface) 75%)`,
              }} />
            ))}
          </div>
        )}

        {error !== null && (
          <Card>
            <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>{error}</p>
          </Card>
        )}

        {!loading && error === null && entries.length === 0 && (
          <Card>
            <EmptyState
              title="No interactions yet"
              description="Once users interact with UI components, the log will appear here."
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10M18 20V4M6 20v-4" />
                </svg>
              }
            />
          </Card>
        )}

        {!loading && error === null && entries.length > 0 && (
          <>
            <div className="animate-in" style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr 1fr 100px 100px',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--ink-low)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                <span>Time</span>
                <span>User</span>
                <span>Component</span>
                <span>Type</span>
                <span>Outcome</span>
              </div>

              {/* Rows */}
              <div className="stagger">
                {entries.map((entry) => {
                  const isAllowed = entry.outcome === 'allowed';
                  return (
                    <div
                      key={entry.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '160px 1fr 1fr 100px 100px',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3) var(--space-4)',
                        borderBottom: '1px solid var(--border)',
                        fontSize: 'var(--text-sm)',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: 'var(--ink-mid)', fontSize: 'var(--text-xs)' }}>
                        {new Date(entry.occurredAt).toLocaleString()}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--ink-mid)' }}>
                        {entry.userId}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--ink-mid)' }}>
                        {entry.componentId}
                      </span>
                      <Badge variant={TYPE_BADGE[entry.componentType] ?? 'default'}>{entry.componentType}</Badge>
                      <Badge variant={isAllowed ? 'success' : 'danger'}>
                        {isAllowed ? 'allowed' : 'denied'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="animate-in" style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
              <Button variant="secondary" onClick={() => void loadMore()}>Load more</Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
