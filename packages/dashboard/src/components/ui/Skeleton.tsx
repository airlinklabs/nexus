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
        background: 'var(--bg-surface)',
        borderRadius,
        animation: 'pulse 1.5s ease-in-out infinite',
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
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}
    >
      <Skeleton width={32} height={32} borderRadius="var(--radius-sm)" />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={14} />
      </div>
    </div>
  );
}
