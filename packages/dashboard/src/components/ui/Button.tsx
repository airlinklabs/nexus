import type { ReactNode, MouseEventHandler } from 'react';

type ButtonProps = {
  readonly children: ReactNode;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  readonly size?: 'sm' | 'md';
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit';
};

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--bg-base)',
    fontWeight: 500,
  },
  secondary: {
    background: 'var(--bg-elevated)',
    color: 'var(--ink-mid)',
    border: '1px solid var(--border)',
  },
  danger: {
    background: 'transparent',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ink-mid)',
  },
};

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: {
    padding: 'var(--space-1) var(--space-2)',
    fontSize: 'var(--text-xs)',
  },
  md: {
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--text-sm)',
  },
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-1)',
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background var(--duration-fast) var(--ease-out), opacity var(--duration-fast) var(--ease-out)',
        fontFamily: 'var(--font-sans)',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
      }}
    >
      {children}
    </button>
  );
}
