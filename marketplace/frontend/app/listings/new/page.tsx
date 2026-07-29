'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { SectionMarker } from '../../../components/ui/SectionMarker';

export default function NewListingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', price: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const listing = await api.createListing({
        title: form.title,
        description: form.description,
        price: form.price ? Number(form.price) : undefined,
      });
      await api.publishListing(listing.id);
      router.push(`/listings/${listing.id}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create listing. Are you logged in?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <div className="mx-auto max-w-md">
        <SectionMarker index="—" label="New listing" />
        <h1 className="mt-4 font-display text-display-md font-semibold tracking-tight">
          Sell something.
        </h1>
        <p className="mt-2 text-sm text-muted">
          Every listing publishes instantly and shows up in search right away.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error && (
            <p className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            className="w-full rounded-md border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus-visible:border-verified"
            placeholder="Description"
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <Input
            placeholder="Price (optional)"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Publishing…' : 'Publish listing'}
          </Button>
        </form>
      </div>
    </main>
  );
}
