'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

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

  async function load(query?: string) {
    setLoading(true);
    const results = await api.searchListings(query);
    setListings(results);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
        className="flex gap-2"
      >
        <input
          className="border rounded p-2 flex-1"
          placeholder="Search listings..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="bg-black text-white px-4 py-2 rounded">Search</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : listings.length === 0 ? (
        <p className="text-neutral-500">No active listings yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/listings/${l.id}`}
              className="border rounded p-4 hover:shadow bg-white"
            >
              <h3 className="font-semibold">{l.title}</h3>
              <p className="text-sm text-neutral-500">by {l.seller.displayName}</p>
              {l.price && (
                <p className="mt-2 font-medium">
                  {l.currency} {l.price}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
