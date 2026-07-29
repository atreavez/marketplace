'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { SectionMarker } from '../ui/SectionMarker';

const STATS = [
  { value: 2400000, suffix: '+', label: 'Active listings', format: (n: number) => `${(n / 1e6).toFixed(1)}M` },
  { value: 190, suffix: '', label: 'Countries reached', format: (n: number) => `${Math.round(n)}` },
  { value: 99.4, suffix: '%', label: 'Disputes resolved fairly', format: (n: number) => n.toFixed(1) },
  { value: 340000000, suffix: '', label: 'Escrowed to date', format: (n: number) => `$${(n / 1e6).toFixed(0)}M` },
];

function CountUp({ target, format }: { target: number; format: (n: number) => string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return <span ref={ref}>{format(value)}</span>;
}

export function TrustStats() {
  return (
    <section id="trust" className="border-b border-line">
      <div className="mx-auto max-w-content px-6 py-24">
        <SectionMarker index="05" label="Why people trust it" />
        <div className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <div className="font-display text-display-md font-semibold tracking-tight md:text-display-lg">
                <CountUp target={stat.value} format={stat.format} />
                {stat.suffix}
              </div>
              <div className="mt-2 text-sm text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
