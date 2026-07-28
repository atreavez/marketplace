'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/Button';

const CATEGORIES = [
  'vehicles',
  'freelance work',
  'real estate',
  'handmade goods',
  'event tickets',
  'consulting',
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const id = setInterval(() => setWordIndex((i) => (i + 1) % CATEGORIES.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* ambient backdrop — restrained, not a loud gradient blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 85% -10%, rgba(31,111,92,0.08), transparent 70%), radial-gradient(40% 40% at 5% 10%, rgba(192,138,62,0.06), transparent 70%)',
        }}
      />

      <div className="relative mx-auto grid max-w-content gap-12 px-6 pb-24 pt-20 md:pt-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-verified" />
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted">
                Every deal, escrow-protected
              </span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-6 font-display text-display-lg font-semibold leading-[1.05] tracking-tight md:text-display-xl lg:text-display-2xl"
          >
            One marketplace.
            <br />
            <span className="text-muted">Anything worth trading.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-6 max-w-md text-lg leading-relaxed text-muted"
          >
            Buy, sell, hire, and book — from{' '}
            <span className="font-mono text-ink">
              {CATEGORIES[wordIndex]}
            </span>{' '}
            to almost anything else. Every transaction is tracked from first
            message to final payout.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-10">
            <div className="flex max-w-lg items-center gap-2 rounded-lg border border-line bg-surface p-2 shadow-sm transition-shadow duration-med focus-within:shadow-md">
              <Search className="ml-2 h-4 w-4 shrink-0 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search listings, sellers, categories..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
              <Button size="sm">Search</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted">
              <span>190+ countries</span>
              <span>·</span>
              <span>2.4M active listings</span>
              <span>·</span>
              <span>Crypto &amp; card payments</span>
            </div>
          </motion.div>
        </div>

        {/* Signature element: the ledger stub. A search receipt made visible —
            it's what the platform's own Deal model actually tracks. */}
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="relative rounded-lg border border-line bg-ink text-paper shadow-lg">
            <div className="grain absolute inset-0 rounded-lg" />
            <div className="relative flex items-center justify-between border-b border-dashed border-paper/20 px-6 py-4">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-paper/50">
                Deal Ledger
              </span>
              <span className="font-mono text-[0.6875rem] text-verified">● Live</span>
            </div>

            <div className="relative space-y-4 px-6 py-6">
              {[
                { label: 'Inquiry sent', time: '09:14', done: true },
                { label: 'Terms accepted', time: '09:22', done: true },
                { label: 'Payment escrowed', time: '09:23', done: true },
                { label: 'Released to seller', time: 'pending', done: false },
              ].map((row, i) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      row.done ? 'bg-verified' : 'border border-paper/30 bg-transparent'
                    }`}
                  />
                  <span className={`flex-1 text-sm ${row.done ? 'text-paper' : 'text-paper/40'}`}>
                    {row.label}
                  </span>
                  <span className="font-mono text-xs text-paper/40">{row.time}</span>
                </div>
              ))}
            </div>

            {/* perforated edge */}
            <div className="relative flex items-center gap-1.5 border-t border-dashed border-paper/20 px-6 py-4">
              <ArrowUpRight className="h-4 w-4 text-verified" />
              <span className="font-mono text-xs text-paper/60">
                Funds held until buyer confirms receipt
              </span>
            </div>
          </div>
          {/* punch-hole notches to sell the "stub" concept */}
          <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-paper" />
          <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-paper" />
        </motion.div>
      </div>
    </section>
  );
}
