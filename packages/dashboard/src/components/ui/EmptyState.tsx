import type { ReactNode } from 'react';

type EmptyStateProps = {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
  readonly icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: 'var(--space-12) var(--space-8)',
        textAlign: 'center',
      }}
    >
      {icon !== undefined && (
        <div style={{
          marginBottom: 'var(--space-4)',
          color: 'var(--ink-faint)',
          fontSize: '2rem',
        }}>
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
          color: 'var(--ink-high)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--ink-mid)',
          maxWidth: 400,
          margin: '0 auto',
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
      {action !== undefined && (
        <div style={{ marginTop: 'var(--space-5)' }}>{action}</div>
      )}
    </div>
  );
}
