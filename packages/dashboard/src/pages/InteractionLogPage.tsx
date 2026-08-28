import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiError, type LogEntry } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.js';

const TYPE_COLORS: Record<string, string> = {
  button: 'var(--info)',
  select: 'var(--success)',
  modal: 'var(--warning)',
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
    api.messages
      .log(guildId, 50)
      .then((res) => {
        if (!cancelled) {
          setEntries(res.log);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err instanceof ApiError ? err.message : 'Failed to load log.';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const loadMore = async () => {
    if (guildId === undefined || entries.length === 0) return;
    const lastId = entries[entries.length - 1]?.id;
    if (lastId === undefined) return;
    try {
      const res = await api.messages.log(guildId, 50);
      const newEntries = res.log.filter((e) => !entries.some((x) => x.id === e.id));
      setEntries((prev) => [...prev, ...newEntries]);
    } catch {
      // silently fail on load more
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link
            to={`/dashboard/${guildId}`}
            style={{
              color: 'var(--ink-low)',
              fontSize: 'var(--text-sm)',
              textDecoration: 'none',
            }}
          >
            ← Config
          </Link>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--ink-high)',
            }}
          >
            nexus
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
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            marginBottom: 'var(--space-6)',
          }}
        >
          Interaction log
        </h2>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  height: 40,
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
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

        {!loading && error === null && entries.length === 0 && (
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
            No interactions recorded yet. Once users interact with UI components, the log will show up here.
          </div>
        )}

        {!loading && error === null && entries.length > 0 && (
          <>
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--bg-surface)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <th style={thStyle}>Time</th>
                    <th style={thStyle}>User ID</th>
                    <th style={thStyle}>Component ID</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const isAllowed = entry.outcome === 'allowed';
                    return (
                      <tr
                        key={entry.id}
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        <td style={tdStyle}>
                          {new Date(entry.occurredAt).toLocaleString()}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>
                          {entry.userId}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>
                          {entry.componentId}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              padding: '2px var(--space-2)',
                              borderRadius: 'var(--radius-sm)',
                              background: TYPE_COLORS[entry.componentType] ?? 'var(--ink-faint)',
                              color: 'var(--bg-base)',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 500,
                            }}
                          >
                            {entry.componentType}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span
                            title={isAllowed ? undefined : entry.outcome}
                            style={{
                              padding: '2px var(--space-2)',
                              borderRadius: 'var(--radius-sm)',
                              background: isAllowed
                                ? 'var(--success)'
                                : 'var(--danger)',
                              color: 'var(--bg-base)',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 500,
                              cursor: isAllowed ? undefined : 'help',
                            }}
                          >
                            {isAllowed ? 'allowed' : 'denied'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
              <button
                onClick={() => {
                  void loadMore();
                }}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--ink-mid)',
                }}
              >
                Load more
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-3)',
  textAlign: 'left',
  fontWeight: 500,
  color: 'var(--ink-mid)',
  fontSize: 'var(--text-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-3)',
  color: 'var(--ink-mid)',
};
