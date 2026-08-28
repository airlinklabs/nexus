type BadgeProps = {
  readonly children: React.ReactNode;
  readonly variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
};

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  default: {
    background: 'var(--bg-elevated)',
    color: 'var(--ink-mid)',
  },
  success: {
    background: 'var(--success)',
    color: 'var(--bg-base)',
  },
  warning: {
    background: 'var(--warning)',
    color: 'var(--bg-base)',
  },
  danger: {
    background: 'var(--danger)',
    color: 'var(--bg-base)',
  },
  info: {
    background: 'var(--info)',
    color: 'var(--bg-base)',
  },
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px var(--space-2)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
        lineHeight: 1.4,
        ...VARIANT_STYLES[variant],
      }}
    >
      {children}
    </span>
  );
}
