'use client';
import { motion } from 'framer-motion';
import {
  Car, Laptop, Home, Briefcase, Palette, Wrench, Ticket, Sprout,
} from 'lucide-react';
import { SectionMarker } from '../ui/SectionMarker';
import { clsx } from '../../lib/clsx';

const CATEGORIES = [
  { name: 'Vehicles', count: '184K', icon: Car, span: 'lg:col-span-2 lg:row-span-2' },
  { name: 'Electronics', count: '412K', icon: Laptop, span: '' },
  { name: 'Real Estate', count: '52K', icon: Home, span: '' },
  { name: 'Freelance', count: '298K', icon: Briefcase, span: 'lg:row-span-2' },
  { name: 'Art & Design', count: '76K', icon: Palette, span: '' },
  { name: 'Services', count: '163K', icon: Wrench, span: '' },
  { name: 'Events', count: '31K', icon: Ticket, span: '' },
  { name: 'Agriculture', count: '44K', icon: Sprout, span: '' },
];

export function CategoryExplorer() {
  return (
    <section id="categories" className="border-b border-line">
      <div className="mx-auto max-w-content px-6 py-24">
        <SectionMarker index="01" label="Discover" />
        <h2 className="mt-4 max-w-lg font-display text-display-md font-semibold tracking-tight md:text-display-lg">
          Every category is a real marketplace of its own.
        </h2>

        <div className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:grid-rows-2">
          {CATEGORIES.map((cat, i) => (
            <motion.a
              href="/listings"
              key={cat.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={clsx(
                'group relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-lg border border-line bg-surface p-5',
                'transition-all duration-med ease-out-expo hover:-translate-y-1 hover:border-ink/15 hover:shadow-lg',
                cat.span,
              )}
            >
              <cat.icon
                className="h-6 w-6 text-ink/70 transition-colors duration-med group-hover:text-verified"
                strokeWidth={1.5}
              />
              <div>
                <div className="font-medium">{cat.name}</div>
                <div className="font-mono text-xs text-muted">{cat.count} listings</div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
