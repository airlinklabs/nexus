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
    api.templates
      .list(guildId)
      .then((res) => {
        if (!cancelled) {
          setTemplates(res.templates);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof ApiError ? err.message : 'Failed to load templates.';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const handleDelete = async (templateId: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    if (guildId === undefined) return;
    try {
      await api.templates.delete(guildId, templateId);
      setTemplates((prev) => prev.filter((t) => t.templateId !== templateId));
      showToast('Template deleted.', 'success');
    } catch {
      showToast('Failed to delete template.', 'error');
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

      <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-6)',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
            Templates
          </h2>
          <Button onClick={() => setShowCreate(true)}>+ New template</Button>
        </div>

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

        {!loading && error === null && templates.length === 0 && (
          <Card>
            <EmptyState
              title="No templates yet"
              description="Templates let your team create UIs without writing code. Create a template once, use it anywhere."
              action={
                <Button onClick={() => setShowCreate(true)}>Create your first template</Button>
              }
            />
          </Card>
        )}

        {!loading && error === null && templates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {templates.map((t) => (
              <Card key={t.templateId}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 'var(--space-4)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          fontSize: 'var(--text-sm)',
                        }}
                      >
                        {t.name}
                      </span>
                      <Badge variant="info">template</Badge>
                    </div>
                    {t.description.length > 0 && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-mid)' }}>
                        {t.description}
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--ink-faint)',
                        marginTop: 'var(--space-2)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      /ui use template:{t.name}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button variant="ghost" size="sm" onClick={() => {
                      const cmd = `/ui use template:${t.name}`;
                      void navigator.clipboard.writeText(cmd);
                      showToast('Copied to clipboard.', 'success');
                    }}>
                      Copy
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => void handleDelete(t.templateId, t.name)}>
                      Delete
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

function CreateTemplateModal({
  guildId,
  onClose,
  onCreated,
}: {
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
      const msg = err instanceof ApiError ? err.message : 'Failed to create template.';
      setError(msg);
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
        <Input
          label="Name"
          placeholder="e.g. feedback-poll"
          value={name}
          onChange={setName}
          mono
        />
        <Input
          label="Description"
          placeholder="A short description of what this template does"
          value={description}
          onChange={setDescription}
        />
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
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
          Use {'{{variableName}}'} in the definition to create args that users fill in when invoking the template.
        </p>
      </div>
    </Modal>
  );
}
