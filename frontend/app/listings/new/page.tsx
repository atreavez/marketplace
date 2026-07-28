'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

export default function NewListingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', price: '' });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Sell something</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input
        className="w-full border rounded p-2"
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <textarea
        className="w-full border rounded p-2"
        placeholder="Description"
        rows={5}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        required
      />
      <input
        className="w-full border rounded p-2"
        placeholder="Price (optional)"
        type="number"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
      />
      <button className="bg-black text-white px-4 py-2 rounded w-full">
        Publish listing
      </button>
    </form>
  );
}
