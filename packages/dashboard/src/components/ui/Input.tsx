import { forwardRef } from 'react';

type InputProps = {
  readonly label?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  readonly mono?: boolean;
  readonly error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | ' onKeyDown'>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, placeholder, value, onChange, onKeyDown, mono, error, style, ...rest }, ref) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {label !== undefined && (
          <label
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              color: 'var(--ink-mid)',
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={onKeyDown}
          style={{
            fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
            borderColor: error !== undefined ? 'var(--danger)' : undefined,
            ...style,
          }}
          {...rest}
        />
        {error !== undefined && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>{error}</span>
        )}
      </div>
    );
  },
);
