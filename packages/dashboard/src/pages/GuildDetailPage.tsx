import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiError, type GuildConfig } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.js';
import { Card, Button, Badge, Input, Select, showToast } from '../components/ui/index.js';

const COMMANDS = [
  'dialog', 'confirm', 'menu', 'form', 'poll', 'embed', 'wizard', 'panel', 'use', 'templates', 'file', 'reload', 'delete',
] as const;

const COMMAND_DESCRIPTIONS: Record<string, string> = {
  dialog: 'Send a message with up to 5 buttons',
  confirm: 'Two-button confirm / cancel prompt',
  menu: 'Dropdown select menu',
  form: 'Multi-field modal form',
  poll: 'Interactive poll with live results',
  embed: 'Rich embed, optionally with navigation',
  wizard: 'Multi-step wizard with prev/next',
  panel: 'Persistent panel (ticket, role selector)',
  use: 'Invoke a template or definition',
  templates: 'List available templates',
  file: 'Load UI from a URL',
  reload: 'Reload a cached definition',
  delete: 'Remove a UI message',
};

type DiscordRole = { id: string; name: string; color: number; position: number };

export function GuildDetailPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { logout } = useAuth();
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [guildInfo, setGuildInfo] = useState<{ id: string; name: string; icon: string | null } | null>(null);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [domainInput, setDomainInput] = useState('');
  const [roleCommand, setRoleCommand] = useState<string>(COMMANDS[0]);
  const [roleIdInput, setRoleIdInput] = useState('');

  const showToast_ = useCallback((msg: string) => showToast(msg, 'success'), []);

  useEffect(() => {
    if (guildId === undefined) return;
    let cancelled = false;
    Promise.all([api.guilds.get(guildId), api.guilds.roles(guildId)])
      .then(([configRes, rolesRes]) => {
        if (!cancelled) {
          setConfig(configRes.config);
          setGuildInfo(configRes.guild);
          setRoles(rolesRes.roles);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load config.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [guildId]);

  const handleAddDomain = async () => {
    if (guildId === undefined || domainInput.trim() === '') return;
    const domain = domainInput.trim().toLowerCase();
    const prev = config;
    if (prev === null) return;
    setConfig({ ...prev, trustedDomains: [...prev.trustedDomains, domain] });
    setDomainInput('');
    try { await api.guilds.addDomain(guildId, domain); showToast_('Domain added.'); }
    catch { setConfig(prev); showToast("Couldn't add that domain.", 'error'); }
  };

  const handleRemoveDomain = async (domain: string) => {
    if (guildId === undefined) return;
    const prev = config;
    if (prev === null) return;
    setConfig({ ...prev, trustedDomains: prev.trustedDomains.filter((d) => d !== domain) });
    try { await api.guilds.removeDomain(guildId, domain); showToast_('Domain removed.'); }
    catch { setConfig(prev); showToast("Couldn't remove that domain.", 'error'); }
  };

  const handleAddRole = async () => {
    if (guildId === undefined || roleIdInput.trim() === '') return;
    const roleId = roleIdInput.trim();
    const prev = config;
    if (prev === null) return;
    const currentRoles = prev.commandRoles[roleCommand] ?? [];
    if (currentRoles.includes(roleId)) { showToast('That role is already assigned.', 'info'); return; }
    const updated = { ...prev.commandRoles, [roleCommand]: [...currentRoles, roleId] };
    setConfig({ ...prev, commandRoles: updated });
    setRoleIdInput('');
    try { await api.guilds.setCommandRoles(guildId, roleCommand, updated[roleCommand] ?? []); showToast_('Role added.'); }
    catch { setConfig(prev); showToast("Couldn't add that role.", 'error'); }
  };

  const handleRemoveRole = async (commandName: string, roleId: string) => {
    if (guildId === undefined) return;
    const prev = config;
    if (prev === null) return;
    const updated = (prev.commandRoles[commandName] ?? []).filter((r) => r !== roleId);
    setConfig({ ...prev, commandRoles: { ...prev.commandRoles, [commandName]: updated } });
    try { await api.guilds.setCommandRoles(guildId, commandName, updated); showToast_('Role removed.'); }
    catch { setConfig(prev); showToast("Couldn't remove that role.", 'error'); }
  };

  const handleSetGlobalRole = async (roleId: string) => {
    if (guildId === undefined) return;
    const prev = config;
    if (prev === null) return;
    setConfig({ ...prev, globalRole: roleId || null });
    try { await api.guilds.setGlobalRole(guildId, roleId || null); showToast_(roleId ? 'Global role set.' : 'Global role removed.'); }
    catch { setConfig(prev); showToast("Couldn't update global role.", 'error'); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-6)',
          background: 'oklch(14% 0.008 250 / 80%)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Skeleton width={60} height={16} />
          </div>
        </header>
        <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: 'var(--space-4)' }} />
          ))}
        </main>
      </div>
    );
  }

  if (error !== null || config === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
          <Card><p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>{error ?? 'Config not found.'}</p></Card>
        </div>
      </div>
    );
  }

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
          <Link to="/dashboard" style={{
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
            Servers
          </Link>
          <span style={{ color: 'var(--ink-faint)', fontSize: 'var(--text-sm)' }}>/</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink-high)',
            fontSize: 'var(--text-sm)',
            maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {guildInfo?.name ?? 'Server'}
          </span>
        </div>
        <button
          onClick={() => void logout()}
          style={{
            fontSize: 'var(--text-xs)', color: 'var(--ink-low)',
            padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)',
            transition: 'color var(--duration-fast) var(--ease-out)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-low)'; }}
        >
          Log out
        </button>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        {/* Server header */}
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          {guildInfo?.icon !== null && guildInfo?.icon !== undefined ? (
            <img src={`https://cdn.discordapp.com/icons/${guildInfo.id}/${guildInfo.icon}.png?size=80`} alt="" width={48} height={48} style={{ borderRadius: 'var(--radius-lg)' }} />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--bg-base)',
            }}>
              {(guildInfo?.name ?? 'S').charAt(0)}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>{guildInfo?.name ?? 'Server'}</h1>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
              <Badge variant="accent">{config.trustedDomains.length} domains</Badge>
              <Badge variant="info">{Object.keys(config.commandRoles).length} restricted</Badge>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="animate-in" style={{ animationDelay: '60ms', display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          <Link to={`/dashboard/${guildId}/templates`} style={{ textDecoration: 'none', flex: 1 }}>
            <Card padding="md" hover>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Templates</span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-mid)' }}>Create reusable UI presets</p>
            </Card>
          </Link>
          <Link to={`/dashboard/${guildId}/log`} style={{ textDecoration: 'none', flex: 1 }}>
            <Card padding="md" hover>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10M18 20V4M6 20v-4" />
                </svg>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Activity</span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-mid)' }}>View interaction logs</p>
            </Card>
          </Link>
        </div>

        {/* Global role */}
        <section className="animate-in" style={{ animationDelay: '120ms', marginBottom: 'var(--space-8)' }}>
          <h2 style={{
            fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-low)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)',
          }}>
            Global role restriction
          </h2>
          <Card>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-mid)', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>
              Set a role that can use all Nexus commands. Leave empty to allow everyone.
            </p>
            <Select
              value={config.globalRole ?? ''}
              onChange={(val) => void handleSetGlobalRole(val)}
              options={[
                { value: '', label: 'Everyone (no restriction)' },
                ...roles.map((r) => ({ value: r.id, label: `@${r.name}` })),
              ]}
            />
            {config.globalRole !== null && (
              <div style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-3)',
                background: 'var(--accent-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid oklch(72% 0.14 170 / 20%)',
              }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>
                  Only users with this role can use Nexus commands.
                </p>
              </div>
            )}
          </Card>
        </section>

        {/* Command restrictions */}
        <section className="animate-in" style={{ animationDelay: '180ms', marginBottom: 'var(--space-8)' }}>
          <h2 style={{
            fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-low)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)',
          }}>
            Per-command permissions
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: 'var(--space-3)' }}>
            Additional role restrictions for specific commands. These stack with the global role.
          </p>

          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {COMMANDS.map((cmd) => {
              const cmdRoles = config.commandRoles[cmd] ?? [];
              const isEditing = roleCommand === cmd;

              return (
                <Card key={cmd} padding="md">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--ink-high)' }}>/ui {cmd}</span>
                      {cmdRoles.length === 0 ? (
                        <Badge variant="success">open</Badge>
                      ) : (
                        <Badge variant="warning">{cmdRoles.length}</Badge>
                      )}
                    </div>
                    {!isEditing && (
                      <Button variant="ghost" size="sm" onClick={() => { setRoleCommand(cmd); setRoleIdInput(''); }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </Button>
                    )}
                  </div>

                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: cmdRoles.length > 0 || isEditing ? 'var(--space-2)' : 0 }}>
                    {COMMAND_DESCRIPTIONS[cmd] ?? ''}
                  </p>

                  {cmdRoles.length > 0 && !isEditing && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                      {cmdRoles.map((roleId) => {
                        const role = roles.find((r) => r.id === roleId);
                        return (
                          <span key={roleId} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
                            padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--text-xs)', color: 'var(--ink-mid)',
                            border: '1px solid var(--border)',
                          }}>
                            {role !== undefined ? `@${role.name}` : roleId}
                            <button
                              onClick={() => void handleRemoveRole(cmd, roleId)}
                              style={{
                                color: 'var(--ink-faint)', fontSize: '10px', lineHeight: 1,
                                transition: 'color var(--duration-fast) var(--ease-out)',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-faint)'; }}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {isEditing && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <div style={{ flex: 1 }}>
                        <Select
                          value={roleIdInput}
                          onChange={setRoleIdInput}
                          placeholder="Select a role..."
                          options={roles.filter((r) => !cmdRoles.includes(r.id)).map((r) => ({ value: r.id, label: `@${r.name}` }))}
                        />
                      </div>
                      <Button size="sm" onClick={() => { if (roleIdInput) void handleAddRole(); }} disabled={!roleIdInput}>Add</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setRoleCommand(cmd); setRoleIdInput(''); }}>Cancel</Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Trusted domains */}
        <section className="animate-in" style={{ animationDelay: '240ms' }}>
          <h2 style={{
            fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-low)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)',
          }}>
            Trusted domains
          </h2>
          <Card>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-mid)', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>
              Domains allowed to serve remote JS definitions. GitHub raw and Gist are trusted by default.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <Input placeholder="example.com" value={domainInput} onChange={setDomainInput} mono onKeyDown={(e) => { if (e.key === 'Enter') void handleAddDomain(); }} />
              <Button onClick={() => void handleAddDomain()}>Add</Button>
            </div>
            {config.trustedDomains.length === 0 ? (
              <div style={{
                padding: 'var(--space-6)',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>No custom domains yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {config.trustedDomains.map((domain) => (
                  <div key={domain} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--ink-mid)' }}>{domain}</span>
                    <Button variant="ghost" size="sm" onClick={() => void handleRemoveDomain(domain)}>Remove</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}

function Skeleton({ width, height = 16, borderRadius = 'var(--radius-sm)' }: { width?: number | string; height?: number; borderRadius?: string }) {
  return (
    <div style={{
      width, height,
      background: 'var(--bg-surface)',
      borderRadius,
      animation: 'pulse-subtle 1.5s ease-in-out infinite',
    }} />
  );
}
