import { forwardRef } from 'react';

type TextareaProps = {
  readonly label?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly rows?: number;
  readonly mono?: boolean;
  readonly error?: string;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, placeholder, value, onChange, rows = 4, mono, error, style }, ref) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {label !== undefined && (
          <label
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              color: 'var(--ink-mid)',
              letterSpacing: '0.01em',
            }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          value={value}
          placeholder={placeholder}
          rows={rows}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
            fontSize: mono ? 'var(--text-xs)' : 'var(--text-sm)',
            resize: 'vertical',
            minHeight: rows * 1.6 + 'rem',
            borderColor: error !== undefined ? 'var(--danger)' : undefined,
            lineHeight: 1.6,
            ...style,
          }}
        />
        {error !== undefined && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', lineHeight: 1.4 }}>{error}</span>
        )}
      </div>
    );
  },
);
