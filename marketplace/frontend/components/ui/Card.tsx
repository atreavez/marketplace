import { clsx } from '../../lib/clsx';

export function Card({
  children,
  className,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-line bg-surface',
        interactive &&
          'transition-all duration-med ease-out-expo hover:-translate-y-1 hover:shadow-lg hover:border-ink/10',
        className,
      )}
    >
      {children}
    </div>
  );
}
