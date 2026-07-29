// Generates a deterministic, category-derived gradient + icon treatment so
// every listing card has a distinct visual identity without pretending to
// show a real product photo. Seeded by name, so the same listing always
// renders the same swatch.
import { clsx } from '../../lib/clsx';
import type { LucideIcon } from 'lucide-react';

const PALETTES: [string, string][] = [
  ['#1F6F5C', '#0B0E14'], // verified emerald -> ink
  ['#C08A3E', '#1F6F5C'], // brass -> emerald
  ['#0B0E14', '#2A3441'], // ink -> slate
  ['#3A5A50', '#0B0E14'], // deep moss -> ink
  ['#8C6A2F', '#0B0E14'], // dark brass -> ink
];

function seedFrom(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash;
}

export function Swatch({
  seed,
  icon: Icon,
  className,
}: {
  seed: string;
  icon: LucideIcon;
  className?: string;
}) {
  const n = seedFrom(seed);
  const [from, to] = PALETTES[n % PALETTES.length];
  const angle = (n % 4) * 45;

  return (
    <div
      className={clsx('relative flex items-center justify-center overflow-hidden', className)}
      style={{ background: `linear-gradient(${angle}deg, ${from}, ${to})` }}
    >
      <div className="grain absolute inset-0" />
      <Icon className="relative h-7 w-7 text-white/85" strokeWidth={1.5} />
    </div>
  );
}
