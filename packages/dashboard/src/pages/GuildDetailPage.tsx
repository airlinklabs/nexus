import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiError, type GuildConfig } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.js';

const COMMANDS = [
  'dialog',
  'confirm',
  'menu',
  'form',
  'poll',
  'embed',
  'wizard',
  'panel',
] as const;

export function GuildDetailPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { logout } = useAuth();
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [domainInput, setDomainInput] = useState('');
  const [roleCommand, setRoleCommand] = useState<string>(COMMANDS[0]);
  const [roleIdInput, setRoleIdInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (guildId === undefined) return;
    let cancelled = false;
    api.guilds
      .get(guildId)
      .then((res) => {
        if (!cancelled) {
          setConfig(res.config);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err instanceof ApiError ? err.message : 'Failed to load config.';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const handleAddDomain = async () => {
    if (guildId === undefined || domainInput.trim() === '') return;
    const domain = domainInput.trim().toLowerCase();
    const prev = config;
    if (prev === null) return;

    setConfig({
      ...prev,
      trustedDomains: [...prev.trustedDomains, domain],
    });
    setDomainInput('');

    try {
      await api.guilds.addDomain(guildId, domain);
      showToast('Domain added.');
    } catch {
      setConfig(prev);
      showToast("Couldn't add that domain. Try again.");
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    if (!confirm(`Remove trusted domain "${domain}"?`)) return;
    if (guildId === undefined) return;
    const prev = config;
    if (prev === null) return;

    setConfig({
      ...prev,
      trustedDomains: prev.trustedDomains.filter((d) => d !== domain),
    });

    try {
      await api.guilds.removeDomain(guildId, domain);
      showToast('Domain removed.');
    } catch {
      setConfig(prev);
      showToast("Couldn't remove that domain. Try again.");
    }
  };

  const handleAddRole = async () => {
    if (guildId === undefined || roleIdInput.trim() === '') return;
    const roleId = roleIdInput.trim();
    const prev = config;
    if (prev === null) return;

    const currentRoles = prev.commandRoles[roleCommand] ?? [];
    if (currentRoles.includes(roleId)) {
      showToast('That role is already assigned.');
      return;
    }

    const updated = {
      ...prev.commandRoles,
      [roleCommand]: [...currentRoles, roleId],
    };
    setConfig({ ...prev, commandRoles: updated });
    setRoleIdInput('');

    try {
      await api.guilds.setCommandRoles(guildId, roleCommand, updated[roleCommand] ?? []);
      showToast('Role added.');
    } catch {
      setConfig(prev);
      showToast("Couldn't add that role. Try again.");
    }
  };

  const handleRemoveRole = async (commandName: string, roleId: string) => {
    if (guildId === undefined) return;
    const prev = config;
    if (prev === null) return;

    const currentRoles = prev.commandRoles[commandName] ?? [];
    const updated = currentRoles.filter((r) => r !== roleId);
    setConfig({
      ...prev,
      commandRoles: { ...prev.commandRoles, [commandName]: updated },
    });

    try {
      await api.guilds.setCommandRoles(guildId, commandName, updated);
      showToast('Role removed.');
    } catch {
      setConfig(prev);
      showToast("Couldn't remove that role. Try again.");
    }
  };

  if (loading) {
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
            <div style={{ width: 60, height: 16, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }} />
            <div style={{ width: 40, height: 16, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }} />
          </div>
          <div style={{ width: 50, height: 16, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }} />
        </header>
        <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
          <div style={{ width: 120, height: 24, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-8)' }} />
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <div style={{ width: 140, height: 14, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }} />
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 80, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 'var(--space-4)' }} />
            ))}
          </div>
          <div>
            <div style={{ width: 120, height: 14, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }} />
            <div style={{ height: 100, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
          </div>
        </main>
      </div>
    );
  }

  if (error !== null || config === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: 'var(--space-8) var(--space-6)',
          }}
        >
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
            {error ?? 'Config not found.'}
          </div>
        </div>
      </div>
    );
  }

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
            to="/dashboard"
            style={{
              color: 'var(--ink-low)',
              fontSize: 'var(--text-sm)',
              textDecoration: 'none',
            }}
          >
            ← Servers
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

      <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            marginBottom: 'var(--space-8)',
          }}
        >
          Server config
        </h2>

        {/* Command restrictions */}
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h3
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--ink-mid)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-4)',
            }}
          >
            Command restrictions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {COMMANDS.map((cmd) => (
              <div
                key={cmd}
                style={{
                  padding: 'var(--space-4)',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                    }}
                  >
                    /ui {cmd}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-1)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  {(config.commandRoles[cmd] ?? []).length === 0 && (
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--ink-faint)',
                      }}
                    >
                      Everyone
                    </span>
                  )}
                  {(config.commandRoles[cmd] ?? []).map((roleId) => (
                    <span
                      key={roleId}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        padding: '2px var(--space-2)',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--ink-mid)',
                      }}
                    >
                      {roleId}
                      <button
                        onClick={() => {
                          void handleRemoveRole(cmd, roleId);
                        }}
                        style={{
                          color: 'var(--ink-faint)',
                          fontSize: 'var(--text-xs)',
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {roleCommand === cmd ? (
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <input
                      value={roleIdInput}
                      onChange={(e) => setRoleIdInput(e.target.value)}
                      placeholder="Role ID"
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                      }}
                    />
                    <button
                      onClick={() => {
                        void handleAddRole();
                      }}
                      style={{
                        padding: 'var(--space-1) var(--space-3)',
                        background: 'var(--accent)',
                        color: 'var(--bg-base)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                      }}
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRoleCommand(cmd)}
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--accent)',
                    }}
                  >
                    + Add role
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Trusted domains */}
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h3
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--ink-mid)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-4)',
            }}
          >
            Trusted domains
          </h3>

          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <input
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="example.com"
                style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleAddDomain();
                  }
                }}
              />
              <button
                onClick={() => {
                  void handleAddDomain();
                }}
                style={{
                  padding: 'var(--space-1) var(--space-3)',
                  background: 'var(--accent)',
                  color: 'var(--bg-base)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                }}
              >
                Add
              </button>
            </div>
            {config.trustedDomains.length === 0 && (
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--ink-faint)',
                }}
              >
                No trusted domains yet. Add a domain to allow remote JS definitions from it.
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {config.trustedDomains.map((domain) => (
                <div
                  key={domain}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--ink-mid)',
                    }}
                  >
                    {domain}
                  </span>
                  <button
                    onClick={() => {
                      void handleRemoveDomain(domain);
                    }}
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--danger)',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Audit log link */}
        <section>
          <Link
            to={`/dashboard/${guildId}/log`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              fontSize: 'var(--text-sm)',
              color: 'var(--ink-mid)',
              textDecoration: 'none',
            }}
          >
            View interaction log →
          </Link>
        </section>
      </main>

      {toast !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: 'var(--space-6)',
            right: 'var(--space-6)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            color: 'var(--ink-high)',
            boxShadow: '0 4px 12px oklch(0% 0 0 / 40%)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
