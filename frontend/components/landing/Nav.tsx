'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-med ease-out-expo ${
        scrolled
          ? 'border-b border-line bg-paper/70 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          B13
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/listings" className="text-sm text-ink/70 transition-colors hover:text-ink">
            Browse
          </Link>
          <Link href="/listings/new" className="text-sm text-ink/70 transition-colors hover:text-ink">
            Sell
          </Link>
          <Link href="/deals" className="text-sm text-ink/70 transition-colors hover:text-ink">
            My deals
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm text-ink/70 transition-colors hover:text-ink">
            Log in
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>

        <button
          className="p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-paper px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/listings" onClick={() => setOpen(false)}>Browse</Link>
            <Link href="/listings/new" onClick={() => setOpen(false)}>Sell</Link>
            <Link href="/deals" onClick={() => setOpen(false)}>My deals</Link>
            <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
            <Link href="/register" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full">Get started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
