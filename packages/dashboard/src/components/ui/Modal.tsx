import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

type ModalProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
};

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: 0,
        maxWidth: 520,
        width: 'calc(100% - var(--space-8))',
        color: 'var(--ink-high)',
        fontFamily: 'var(--font-sans)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'scale-in var(--duration-base) var(--ease-spring)',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'oklch(0% 0 0 / 50%)',
          backdropFilter: 'blur(4px)',
          zIndex: -1,
        }}
        onClick={onClose}
      />
      <div style={{ padding: 'var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-5)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: 'var(--ink-high)',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              color: 'var(--ink-low)',
              fontSize: 'var(--text-lg)',
              lineHeight: 1,
              padding: 'var(--space-1)',
              borderRadius: 'var(--radius-sm)',
              transition: 'color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--ink-high)';
              e.currentTarget.style.background = 'var(--bg-elevated)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--ink-low)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
      {footer !== undefined && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-2)',
            padding: 'var(--space-4) var(--space-6)',
            borderTop: '1px solid var(--border)',
          }}
        >
          {footer}
        </div>
      )}
    </dialog>
  );
}
