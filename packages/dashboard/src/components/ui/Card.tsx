import type { ReactNode } from 'react';

type CardProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly padding?: 'sm' | 'md' | 'lg';
};

const PAD_MAP = {
  sm: 'var(--space-3)',
  md: 'var(--space-4)',
  lg: 'var(--space-6)',
};

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        padding: PAD_MAP[padding],
      }}
    >
      {children}
    </div>
  );
}
