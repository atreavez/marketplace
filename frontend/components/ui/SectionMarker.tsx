import { clsx } from '../../lib/clsx';

export function SectionMarker({
  index,
  label,
  className,
}: {
  index: string; // e.g. "01"
  label: string;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <span className="font-mono text-xs tracking-[0.14em] text-verified">{index}</span>
      <span className="h-px w-8 bg-line" />
      <span className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
    </div>
  );
}
