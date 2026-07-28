'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search as SearchIcon, Package } from 'lucide-react';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Swatch } from '../../components/ui/Swatch';
import { SectionMarker } from '../../components/ui/SectionMarker';

type Listing = {
  id: string;
  title: string;
  price: string | null;
  currency: string;
  seller: { displayName: string };
};

export default function ListingsPage() {
  const [q, setQ] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(query?: string) {
    setLoading(true);
    setError(null);
    try {
      const results = await api.searchListings(query);
      setListings(results);
    } catch (err: any) {
      setError(err.message ?? 'Could not load listings. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionMarker index="—" label="Browse" />
      <h1 className="mt-4 font-display text-display-md font-semibold tracking-tight md:text-display-lg">
        Find what you're looking for.
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
        className="mt-8 flex max-w-lg items-center gap-2 rounded-lg border border-line bg-surface p-2 shadow-sm"
      >
        <SearchIcon className="ml-2 h-4 w-4 shrink-0 text-muted" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          placeholder="Search listings..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button size="sm" type="submit">Search</Button>
      </form>

      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-lg border border-line bg-ink/[0.03]" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-10 rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : listings.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Package className="h-8 w-8 text-muted" strokeWidth={1.5} />
          <p className="text-muted">No active listings yet. Be the first to list something.</p>
          <Link href="/listings/new">
            <Button size="sm" className="mt-2">Sell something</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((l) => (
            <Link key={l.id} href={`/listings/${l.id}`}>
              <Card interactive className="overflow-hidden">
                <Swatch seed={l.title} icon={Package} className="h-36 w-full" />
                <div className="space-y-1 p-4">
                  <div className="font-medium leading-snug">{l.title}</div>
                  <div className="text-xs text-muted">by {l.seller.displayName}</div>
                  {l.price && (
                    <div className="pt-1 font-mono text-sm">
                      {l.currency} {l.price}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
