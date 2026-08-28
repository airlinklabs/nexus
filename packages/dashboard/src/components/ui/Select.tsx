import { forwardRef } from 'react';

type SelectProps = {
  readonly label?: string;
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly options: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly style?: React.CSSProperties;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, value, onChange, options, style }, ref) {
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
        <select
          ref={ref}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            fontFamily: 'var(--font-sans)',
            ...style,
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
