'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export function ClosingCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true); // wire to a real newsletter endpoint when one exists
  }

  return (
    <section className="relative overflow-hidden border-b border-line bg-ink text-paper">
      <div className="grain absolute inset-0" />
      <div className="relative mx-auto max-w-content px-6 py-24 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl font-display text-display-lg font-semibold tracking-tight md:text-display-xl"
        >
          Start your first deal today.
        </motion.h2>
        <p className="mx-auto mt-4 max-w-md text-paper/60">
          Free to join. List your first item in under two minutes.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register">
            <Button variant="brass" size="lg" className="gap-2">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/listings">
            <Button
              variant="secondary"
              size="lg"
              className="border-paper/20 bg-transparent text-paper hover:border-paper/40"
            >
              Browse listings
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-16 max-w-sm border-t border-paper/10 pt-8">
          <p className="font-mono text-xs uppercase tracking-wider text-paper/40">
            Get new listing alerts in your inbox
          </p>
          {submitted ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-verified">
              <Check className="h-4 w-4" /> You're on the list
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-paper/15 bg-paper/[0.04] px-4 py-2.5 text-sm text-paper outline-none placeholder:text-paper/30 focus-visible:border-verified"
              />
              <Button type="submit" variant="secondary" size="sm" className="shrink-0 border-paper/20 bg-transparent text-paper">
                Subscribe
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
