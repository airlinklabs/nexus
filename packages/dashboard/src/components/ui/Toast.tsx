import { useEffect, useState, useCallback } from 'react';

type ToastItem = {
  readonly id: number;
  readonly message: string;
  readonly variant: 'success' | 'error' | 'info';
};

let toastId = 0;
let listeners: Array<(toast: ToastItem) => void> = [];

export function showToast(message: string, variant: ToastItem['variant'] = 'info') {
  const toast = { id: ++toastId, message, variant };
  listeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: ToastItem) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 3000);
  }, []);

  useEffect(() => {
    listeners = [...listeners, addToast];
    return () => {
      listeners = listeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        zIndex: 1000,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            color: 'var(--ink-high)',
            boxShadow: '0 4px 12px oklch(0% 0 0 / 40%)',
            borderLeft: `3px solid var(--${toast.variant === 'success' ? 'success' : toast.variant === 'error' ? 'danger' : 'info'})`,
            maxWidth: 360,
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
