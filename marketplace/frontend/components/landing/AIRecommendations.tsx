'use client';
import { motion } from 'framer-motion';
import { Sparkles, Gem, BookOpen, Guitar, Bike } from 'lucide-react';
import { SectionMarker } from '../ui/SectionMarker';
import { Swatch } from '../ui/Swatch';

const ITEMS = [
  { title: 'Handmade ceramic set', reason: 'Because you viewed home goods', icon: Gem },
  { title: 'First-edition novel bundle', reason: 'Sellers you follow', icon: BookOpen },
  { title: 'Acoustic guitar, solid spruce', reason: 'Similar to your recent search', icon: Guitar },
  { title: 'Electric commuter bike', reason: 'Trending in Kampala', icon: Bike },
  { title: 'Vintage camera lens set', reason: 'Matches your saved searches', icon: Sparkles },
];

export function AIRecommendations() {
  return (
    <section id="for-you" className="border-b border-line bg-ink text-paper">
      <div className="relative grain">
        <div className="mx-auto max-w-content px-6 py-24">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-verified" strokeWidth={1.5} />
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-paper/50">
              03 · Curated for you
            </span>
          </div>
          <h2 className="mt-4 max-w-lg font-display text-display-md font-semibold tracking-tight text-paper md:text-display-lg">
            The AI engine learns what you're actually looking for.
          </h2>
          <p className="mt-4 max-w-md text-paper/60">
            Recommendations blend what you've browsed with what similar
            buyers in your area chose next — no dark patterns, just relevance.
          </p>

          <div className="mt-12 flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {ITEMS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-64 shrink-0 overflow-hidden rounded-lg border border-paper/10 bg-paper/[0.03]"
              >
                <Swatch seed={item.title} icon={item.icon} className="h-32 w-full" />
                <div className="p-4">
                  <div className="font-medium text-paper">{item.title}</div>
                  <div className="mt-1 font-mono text-xs text-paper/40">{item.reason}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
