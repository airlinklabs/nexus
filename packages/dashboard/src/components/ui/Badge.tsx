type BadgeProps = {
  readonly children: React.ReactNode;
  readonly variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
};

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  default: {
    background: 'var(--bg-elevated)',
    color: 'var(--ink-mid)',
    border: '1px solid var(--border)',
  },
  success: {
    background: 'oklch(72% 0.16 150 / 12%)',
    color: 'var(--success)',
    border: '1px solid oklch(72% 0.16 150 / 25%)',
  },
  warning: {
    background: 'oklch(80% 0.16 85 / 12%)',
    color: 'var(--warning)',
    border: '1px solid oklch(80% 0.16 85 / 25%)',
  },
  danger: {
    background: 'oklch(62% 0.22 25 / 12%)',
    color: 'var(--danger)',
    border: '1px solid oklch(62% 0.22 25 / 25%)',
  },
  info: {
    background: 'oklch(72% 0.12 240 / 12%)',
    color: 'var(--info)',
    border: '1px solid oklch(72% 0.12 240 / 25%)',
  },
  accent: {
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
    border: '1px solid oklch(72% 0.14 170 / 25%)',
  },
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '0.01em',
        ...VARIANT_STYLES[variant],
      }}
    >
      {children}
    </span>
  );
}
