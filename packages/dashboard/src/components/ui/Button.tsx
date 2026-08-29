import type { ReactNode, MouseEventHandler } from 'react';

type ButtonProps = {
  readonly children: ReactNode;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit';
  readonly fullWidth?: boolean;
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  fullWidth = false,
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    transition: 'all var(--duration-fast) var(--ease-out)',
    width: fullWidth ? '100%' : undefined,
    whiteSpace: 'nowrap',
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 10px', fontSize: 'var(--text-xs)' },
    md: { padding: '8px 14px', fontSize: 'var(--text-sm)' },
    lg: { padding: '10px 18px', fontSize: 'var(--text-base)' },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--accent)',
      color: 'var(--bg-base)',
      boxShadow: 'var(--shadow-sm)',
    },
    accent: {
      background: 'transparent',
      color: 'var(--accent)',
      border: '1px solid var(--accent)',
    },
    secondary: {
      background: 'var(--bg-elevated)',
      color: 'var(--ink-mid)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'transparent',
      color: 'var(--danger)',
      border: '1px solid oklch(62% 0.22 25 / 30%)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-low)',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      onMouseEnter={(e) => {
        if (disabled) return;
        const s = e.currentTarget.style;
        if (variant === 'primary') {
          s.background = 'var(--accent-dim)';
          s.boxShadow = 'var(--shadow-md)';
        } else if (variant === 'ghost') {
          s.background = 'var(--bg-elevated)';
          s.color = 'var(--ink-mid)';
        } else if (variant === 'secondary') {
          s.borderColor = 'var(--border-hover)';
          s.color = 'var(--ink-high)';
        } else if (variant === 'danger') {
          s.background = 'oklch(62% 0.22 25 / 10%)';
        } else if (variant === 'accent') {
          s.background = 'var(--accent-subtle)';
        }
      }}
      onMouseLeave={(e) => {
        const s = e.currentTarget.style;
        if (variant === 'primary') {
          s.background = 'var(--accent)';
          s.boxShadow = 'var(--shadow-sm)';
        } else if (variant === 'ghost') {
          s.background = 'transparent';
          s.color = 'var(--ink-low)';
        } else if (variant === 'secondary') {
          s.borderColor = 'var(--border)';
          s.color = 'var(--ink-mid)';
        } else if (variant === 'danger') {
          s.background = 'transparent';
        } else if (variant === 'accent') {
          s.background = 'transparent';
        }
      }}
    >
      {children}
    </button>
  );
}
