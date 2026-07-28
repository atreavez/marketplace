import { clsx } from '../../lib/clsx';

type Tone = 'neutral' | 'verified' | 'brass' | 'danger';

const toneStyles: Record<Tone, string> = {
  neutral: 'bg-ink/5 text-ink',
  verified: 'bg-verified-soft text-verified',
  brass: 'bg-brass-soft text-brass',
  danger: 'bg-danger/10 text-danger',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'font-mono text-[0.6875rem] font-medium uppercase tracking-wider',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
