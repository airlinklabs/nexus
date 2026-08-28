import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiError, type GuildConfig } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.js';
import { Card, Button, Badge, Input, Select, showToast } from '../components/ui/index.js';

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

const COMMAND_DESCRIPTIONS: Record<string, string> = {
  dialog: 'Send a message with up to 5 buttons',
  confirm: 'Two-button confirm / cancel prompt',
  menu: 'Dropdown select menu',
  form: 'Multi-field modal form',
  poll: 'Interactive poll with live results',
  embed: 'Rich embed, optionally with navigation',
  wizard: 'Multi-step wizard with prev/next',
  panel: 'Persistent panel (ticket, role selector)',
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
    Promise.all([
      api.guilds.get(guildId),
      api.guilds.roles(guildId),
    ])
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
          const msg = err instanceof ApiError ? err.message : 'Failed to load config.';
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

    setConfig({ ...prev, trustedDomains: [...prev.trustedDomains, domain] });
    setDomainInput('');

    try {
      await api.guilds.addDomain(guildId, domain);
      showToast_('Domain added.');
    } catch {
      setConfig(prev);
      showToast("Couldn't add that domain.", 'error');
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    if (!confirm(`Remove trusted domain "${domain}"?`)) return;
    if (guildId === undefined) return;
    const prev = config;
    if (prev === null) return;

    setConfig({ ...prev, trustedDomains: prev.trustedDomains.filter((d) => d !== domain) });

    try {
      await api.guilds.removeDomain(guildId, domain);
      showToast_('Domain removed.');
    } catch {
      setConfig(prev);
      showToast("Couldn't remove that domain.", 'error');
    }
  };

  const handleAddRole = async () => {
    if (guildId === undefined || roleIdInput.trim() === '') return;
    const roleId = roleIdInput.trim();
    const prev = config;
    if (prev === null) return;

    const currentRoles = prev.commandRoles[roleCommand] ?? [];
    if (currentRoles.includes(roleId)) {
      showToast('That role is already assigned.', 'info');
      return;
    }

    const updated = { ...prev.commandRoles, [roleCommand]: [...currentRoles, roleId] };
    setConfig({ ...prev, commandRoles: updated });
    setRoleIdInput('');

    try {
      await api.guilds.setCommandRoles(guildId, roleCommand, updated[roleCommand] ?? []);
      showToast_('Role added.');
    } catch {
      setConfig(prev);
      showToast("Couldn't add that role.", 'error');
    }
  };

  const handleRemoveRole = async (commandName: string, roleId: string) => {
    if (guildId === undefined) return;
    const prev = config;
    if (prev === null) return;

    const updated = (prev.commandRoles[commandName] ?? []).filter((r) => r !== roleId);
    setConfig({ ...prev, commandRoles: { ...prev.commandRoles, [commandName]: updated } });

    try {
      await api.guilds.setCommandRoles(guildId, commandName, updated);
      showToast_('Role removed.');
    } catch {
      setConfig(prev);
      showToast("Couldn't remove that role.", 'error');
    }
  };

  const handleSetGlobalRole = async (roleId: string) => {
    if (guildId === undefined) return;
    const prev = config;
    if (prev === null) return;

    setConfig({ ...prev, globalRole: roleId || null });

    try {
      await api.guilds.setGlobalRole(guildId, roleId || null);
      showToast_(roleId ? 'Global role set.' : 'Global role removed.');
    } catch {
      setConfig(prev);
      showToast("Couldn't update global role.", 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 60, height: 16, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </header>
        <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 'var(--space-4)' }} />
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
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link to="/dashboard" style={{ color: 'var(--ink-low)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>← Servers</Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink-high)' }}>nexus</span>
        </div>
        <button onClick={() => void logout()} style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-low)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)' }}>Log out</button>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        {/* Breadcrumbs */}
        <nav style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
          <Link to="/dashboard" style={{ color: 'var(--ink-faint)', textDecoration: 'none' }}>Servers</Link>
          <span style={{ margin: '0 var(--space-1)' }}>/</span>
          <span style={{ color: 'var(--ink-mid)' }}>{guildInfo?.name ?? 'Server'}</span>
        </nav>

        {/* Server header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          {guildInfo?.icon !== null && guildInfo?.icon !== undefined ? (
            <img src={`https://cdn.discordapp.com/icons/${guildInfo.id}/${guildInfo.icon}.png`} alt="" width={40} height={40} style={{ borderRadius: 'var(--radius-md)' }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--ink-low)' }}>
              {(guildInfo?.name ?? 'S').charAt(0)}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>{guildInfo?.name ?? 'Server'}</h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
              {config.trustedDomains.length} trusted domains · {Object.keys(config.commandRoles).length} restricted commands
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          <Link to={`/dashboard/${guildId}/templates`} style={{ textDecoration: 'none', flex: 1 }}>
            <Card padding="md" style={{ cursor: 'pointer' }}>
              <Badge variant="info">Templates</Badge>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: 'var(--space-1)' }}>Create reusable UI presets for your team</p>
            </Card>
          </Link>
          <Link to={`/dashboard/${guildId}/log`} style={{ textDecoration: 'none', flex: 1 }}>
            <Card padding="md" style={{ cursor: 'pointer' }}>
              <Badge variant="default">Activity</Badge>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: 'var(--space-1)' }}>View interaction logs</p>
            </Card>
          </Link>
        </div>

        {/* Global role */}
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--ink-mid)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-4)' }}>
            Global role restriction
          </h2>
          <Card>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: 'var(--space-3)' }}>
              Set a role that can use all Nexus commands. Leave empty to allow everyone (or use per-command restrictions below).
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
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-mid)', marginTop: 'var(--space-2)' }}>
                Only users with this role can use Nexus commands.
              </p>
            )}
          </Card>
        </section>

        {/* Command restrictions */}
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--ink-mid)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-4)' }}>
            Per-command permissions
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: 'var(--space-4)' }}>
            Additional role restrictions for specific commands. These stack with the global role.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {COMMANDS.map((cmd) => {
              const cmdRoles = config.commandRoles[cmd] ?? [];
              const isEditing = roleCommand === cmd;

              return (
                <Card key={cmd}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>/ui {cmd}</span>
                      {cmdRoles.length === 0 && <Badge variant="success">open</Badge>}
                    </div>
                    {!isEditing && (
                      <Button variant="ghost" size="sm" onClick={() => setRoleCommand(cmd)}>+ Add role</Button>
                    )}
                  </div>

                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: 'var(--space-2)' }}>
                    {COMMAND_DESCRIPTIONS[cmd] ?? ''}
                  </p>

                  {cmdRoles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: isEditing ? 'var(--space-2)' : 0 }}>
                      {cmdRoles.map((roleId) => {
                        const role = roles.find((r) => r.id === roleId);
                        return (
                          <span key={roleId} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: '2px var(--space-2)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--ink-mid)' }}>
                            {role !== undefined ? `@${role.name}` : roleId}
                            <button onClick={() => void handleRemoveRole(cmd, roleId)} style={{ color: 'var(--ink-faint)', fontSize: 'var(--text-xs)', lineHeight: 1 }}>×</button>
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
                          options={[
                            { value: '', label: 'Select a role...' },
                            ...roles
                              .filter((r) => !cmdRoles.includes(r.id))
                              .map((r) => ({ value: r.id, label: `@${r.name}` })),
                          ]}
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
        <section>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--ink-mid)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-4)' }}>
            Trusted domains
          </h2>
          <Card>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: 'var(--space-3)' }}>
              Domains allowed to serve remote JS definitions. GitHub raw and Gist are trusted by default.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <Input placeholder="example.com" value={domainInput} onChange={setDomainInput} mono onKeyDown={(e) => { if (e.key === 'Enter') void handleAddDomain(); }} />
              <Button onClick={() => void handleAddDomain()}>Add</Button>
            </div>
            {config.trustedDomains.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>No custom domains yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {config.trustedDomains.map((domain) => (
                  <div key={domain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
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
