'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionMarker } from '../ui/SectionMarker';
import { clsx } from '../../lib/clsx';

const QUOTES = [
  {
    quote:
      'I sell restored furniture across three countries now. The deal ledger means I never have to chase a buyer for proof of payment — it\u2019s just there.',
    name: 'Jalen R.',
    role: 'Furniture restorer, Lagos',
  },
  {
    quote:
      'Switched my freelance design business over entirely. Escrow means clients pay upfront and I still get to walk away from bad-fit projects.',
    name: 'Nadia F.',
    role: 'Interior consultant, Toronto',
  },
  {
    quote:
      'Bought a car from someone I\u2019d never met, in a different country, and the whole thing felt safer than a local classifieds listing.',
    name: 'Theo M.',
    role: 'Buyer, Berlin',
  },
];

export function Testimonials() {
  const [i, setI] = useState(0);

  return (
    <section id="voices" className="border-b border-line bg-verified-soft/40">
      <div className="mx-auto max-w-content px-6 py-24">
        <SectionMarker index="06" label="In their words" />

        <AnimatePresence mode="wait">
          <motion.blockquote
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 max-w-3xl"
          >
            <p className="font-display text-display-md font-medium leading-[1.25] tracking-tight md:text-display-lg">
              "{QUOTES[i].quote}"
            </p>
            <footer className="mt-6 font-mono text-sm text-muted">
              {QUOTES[i].name} — {QUOTES[i].role}
            </footer>
          </motion.blockquote>
        </AnimatePresence>

        <div className="mt-10 flex gap-2">
          {QUOTES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Show testimonial ${idx + 1}`}
              className={clsx(
                'h-1.5 rounded-full transition-all duration-med ease-out-expo',
                idx === i ? 'w-8 bg-ink' : 'w-1.5 bg-ink/20 hover:bg-ink/40',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
