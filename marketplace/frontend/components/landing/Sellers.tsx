'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { SectionMarker } from '../ui/SectionMarker';
import { Card } from '../ui/Card';
import { clsx } from '../../lib/clsx';

type Seller = { name: string; specialty: string; rating: string; meta: string; color: string };

const TOP_RATED: Seller[] = [
  { name: 'Amara K.', specialty: 'Handmade leather goods', rating: '4.98', meta: '1,204 sales', color: '#1F6F5C' },
  { name: 'Theo M.', specialty: 'Vintage electronics', rating: '4.95', meta: '860 sales', color: '#C08A3E' },
  { name: 'Nadia F.', specialty: 'Interior consulting', rating: '4.97', meta: '412 projects', color: '#3A5A50' },
  { name: 'Jalen R.', specialty: 'Custom furniture', rating: '4.93', meta: '331 sales', color: '#8C6A2F' },
];

const NEARBY: Seller[] = [
  { name: 'Grace O.', specialty: 'Home cleaning', rating: '4.9', meta: '2.1 km away', color: '#1F6F5C' },
  { name: 'Samuel T.', specialty: 'Appliance repair', rating: '4.8', meta: '3.4 km away', color: '#C08A3E' },
  { name: 'Lina P.', specialty: 'Private tutoring', rating: '4.96', meta: '1.2 km away', color: '#3A5A50' },
  { name: 'Kofi A.', specialty: 'Bicycle repair', rating: '4.85', meta: '4.0 km away', color: '#8C6A2F' },
];

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('');
}

export function Sellers() {
  const [tab, setTab] = useState<'Top rated' | 'Near you'>('Top rated');
  const list = tab === 'Top rated' ? TOP_RATED : NEARBY;

  return (
    <section id="sellers" className="border-b border-line">
      <div className="mx-auto max-w-content px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionMarker index="04" label="People behind the listings" />
            <h2 className="mt-4 font-display text-display-md font-semibold tracking-tight md:text-display-lg">
              Sellers worth building a relationship with
            </h2>
          </div>
          <div className="flex gap-1 rounded-full border border-line bg-surface p-1">
            {(['Top rated', 'Near you'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-fast',
                  tab === t ? 'bg-ink text-paper' : 'text-muted hover:text-ink',
                )}
              >
                {t === 'Near you' && <MapPin className="h-3.5 w-3.5" />}
                {t}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {list.map((seller) => (
              <Card key={seller.name} interactive className="p-5">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full font-display text-sm font-semibold text-white"
                  style={{ backgroundColor: seller.color }}
                >
                  {initials(seller.name)}
                </div>
                <div className="mt-4 font-medium">{seller.name}</div>
                <div className="text-sm text-muted">{seller.specialty}</div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="flex items-center gap-1 font-mono text-xs">
                    <Star className="h-3 w-3 fill-brass text-brass" />
                    {seller.rating}
                  </span>
                  <span className="font-mono text-xs text-muted">{seller.meta}</span>
                </div>
              </Card>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
