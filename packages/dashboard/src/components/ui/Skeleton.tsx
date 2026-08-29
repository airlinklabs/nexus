type SkeletonProps = {
  readonly width?: number | string;
  readonly height?: number;
  readonly borderRadius?: string;
};

export function Skeleton({ width, height = 16, borderRadius = 'var(--radius-sm)' }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        background: `linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%)`,
        backgroundSize: '200% 100%',
        borderRadius,
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}
    >
      <Skeleton width={36} height={36} borderRadius="var(--radius-md)" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <Skeleton width="50%" height={14} />
        <Skeleton width="80%" height={12} />
      </div>
    </div>
  );
}
