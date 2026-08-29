import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiError, type TemplateListItem } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.js';
import { Card, Button, Badge, EmptyState, Input, Textarea, Modal, showToast, SkeletonCard } from '../components/ui/index.js';

export function TemplatesPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { logout } = useAuth();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (guildId === undefined) return;
    let cancelled = false;
    api.templates.list(guildId)
      .then((res) => { if (!cancelled) { setTemplates(res.templates); setLoading(false); } })
      .catch((err: unknown) => { if (!cancelled) { setError(err instanceof ApiError ? err.message : 'Failed to load templates.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [guildId]);

  const handleDelete = async (templateId: string, name: string) => {
    if (guildId === undefined) return;
    try {
      await api.templates.delete(guildId, templateId);
      setTemplates((prev) => prev.filter((t) => t.templateId !== templateId));
      showToast('Template deleted.', 'success');
    } catch { showToast('Failed to delete template.', 'error'); }
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
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink-high)', fontSize: 'var(--text-sm)' }}>Templates</span>
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

      <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        {/* Page header */}
        <div className="animate-in" style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--space-6)',
        }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-1)' }}>Templates</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-mid)' }}>Reusable UI presets for your server.</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New template
          </Button>
        </div>

        {loading && (
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {error !== null && (
          <Card><p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>{error}</p></Card>
        )}

        {!loading && error === null && templates.length === 0 && (
          <Card>
            <EmptyState
              title="No templates yet"
              description="Templates let your team create UIs without writing code. Create a template once, use it anywhere."
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              }
              action={<Button onClick={() => setShowCreate(true)}>Create your first template</Button>}
            />
          </Card>
        )}

        {!loading && error === null && templates.length > 0 && (
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {templates.map((t) => (
              <Card key={t.templateId} padding="md" hover>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{t.name}</span>
                      <Badge variant="accent">template</Badge>
                    </div>
                    {t.description.length > 0 && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-mid)', marginBottom: 'var(--space-2)' }}>{t.description}</p>
                    )}
                    <code style={{
                      fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)',
                      background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                    }}>
                      /ui use template:{t.name}
                    </code>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                    <Button variant="ghost" size="sm" onClick={() => {
                      void navigator.clipboard.writeText(`/ui use template:${t.name}`);
                      showToast('Copied to clipboard.', 'success');
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => {
                      if (confirm(`Delete template "${t.name}"?`)) void handleDelete(t.templateId, t.name);
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {showCreate && guildId !== undefined && (
        <CreateTemplateModal
          guildId={guildId}
          onClose={() => setShowCreate(false)}
          onCreated={(template) => {
            setTemplates((prev) => [...prev, template]);
            setShowCreate(false);
            showToast('Template created.', 'success');
          }}
        />
      )}
    </div>
  );
}

function CreateTemplateModal({ guildId, onClose, onCreated }: {
  readonly guildId: string;
  readonly onClose: () => void;
  readonly onCreated: (template: TemplateListItem) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [definition, setDefinition] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (name.trim().length === 0 || definition.trim().length === 0) {
      setError('Name and definition are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await api.templates.create(guildId, {
        name: name.trim(),
        description: description.trim(),
        definition: definition.trim(),
      });
      onCreated({
        templateId: res.template.templateId,
        name: res.template.name,
        description: res.template.description,
        argsSchema: res.template.argsSchema,
        createdBy: res.template.createdBy,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create template.');
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New template"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Creating...' : 'Create template'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input label="Name" placeholder="e.g. feedback-poll" value={name} onChange={setName} mono />
        <Input label="Description" placeholder="A short description of what this template does" value={description} onChange={setDescription} />
        <Textarea
          label="Definition (JavaScript)"
          placeholder={`module.exports = {\n  meta: {},\n  embeds: [{ title: "{{title}}", description: "{{description}}" }],\n  components: [[{ type: "button", id: "ok", label: "OK", style: "primary" }]]\n}`}
          value={definition}
          onChange={setDefinition}
          rows={12}
          mono
        />
        {error !== null && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>{error}</p>
        )}
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', lineHeight: 1.6 }}>
          Use {'{{variableName}}'} in the definition to create args that users fill in when invoking the template.
        </p>
      </div>
    </Modal>
  );
}
