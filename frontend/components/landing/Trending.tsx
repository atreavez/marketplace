'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop, Camera, Wrench, Home, Car, Palette } from 'lucide-react';
import { SectionMarker } from '../ui/SectionMarker';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Swatch } from '../ui/Swatch';
import { clsx } from '../../lib/clsx';

type Item = { title: string; price: string; meta: string; icon: typeof Laptop; tag?: string };

const TABS: Record<string, Item[]> = {
  Trending: [
    { title: 'Mirrorless camera kit', price: '$1,240', meta: 'Nairobi · 3 offers', icon: Camera },
    { title: 'Modern 2BR apartment', price: '$820/mo', meta: 'Lisbon · Available now', icon: Home },
    { title: '2019 hatchback, low mileage', price: '$11,900', meta: 'Kampala · Verified seller', icon: Car },
    { title: 'Standing desk, walnut top', price: '$310', meta: 'Berlin · Local pickup', icon: Laptop },
  ],
  Services: [
    { title: 'Brand identity design', price: 'from $450', meta: '4.9 ★ · 210 projects', icon: Palette },
    { title: 'Home appliance repair', price: '$40/hr', meta: 'Same-day · Nairobi', icon: Wrench },
    { title: 'Product photography', price: 'from $180', meta: '4.8 ★ · 88 projects', icon: Camera },
    { title: 'Full-stack development', price: 'from $65/hr', meta: '4.9 ★ · 340 projects', icon: Laptop },
  ],
  'Ending soon': [
    { title: 'Vintage film camera — auction', price: '$210 bid', meta: '2h 14m left', icon: Camera, tag: 'Auction' },
    { title: 'Studio loft — short lease', price: '$1,100/mo', meta: '6h left', icon: Home, tag: 'Offer' },
    { title: 'Restored motorcycle', price: '$3,400 bid', meta: '11h left', icon: Car, tag: 'Auction' },
    { title: 'Custom furniture commission', price: '15% off', meta: '1 day left', icon: Palette, tag: 'Offer' },
  ],
};

export function Trending() {
  const [tab, setTab] = useState<keyof typeof TABS>('Trending');

  return (
    <section id="trending" className="border-b border-line">
      <div className="mx-auto max-w-content px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionMarker index="02" label="Right now" />
            <h2 className="mt-4 font-display text-display-md font-semibold tracking-tight md:text-display-lg">
              What's moving on the platform
            </h2>
          </div>

          <div className="flex gap-1 rounded-full border border-line bg-surface p-1">
            {Object.keys(TABS).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t as keyof typeof TABS)}
                className={clsx(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-fast',
                  tab === t ? 'bg-ink text-paper' : 'text-muted hover:text-ink',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {TABS[tab].map((item) => (
              <Card key={item.title} interactive className="overflow-hidden">
                <Swatch seed={item.title} icon={item.icon} className="h-36 w-full" />
                <div className="space-y-2 p-4">
                  {item.tag && (
                    <Badge tone={item.tag === 'Auction' ? 'brass' : 'verified'}>{item.tag}</Badge>
                  )}
                  <div className="font-medium leading-snug">{item.title}</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-ink">{item.price}</span>
                    <span className="text-xs text-muted">{item.meta}</span>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
