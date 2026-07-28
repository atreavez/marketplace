'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api.getListing(params.id).then(setListing);
  }, [params.id]);

  async function sendInquiry() {
    setStatus(null);
    try {
      await api.createInquiry({ listingId: params.id, message });
      setStatus('Inquiry sent — check "My Deals" for updates.');
    } catch (err: any) {
      setStatus(err.message ?? 'Could not send inquiry. Are you logged in?');
    }
  }

  if (!listing) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{listing.title}</h1>
      <p className="text-neutral-500">Listed by {listing.seller.displayName}</p>
      {listing.price && <p className="text-xl font-semibold">{listing.currency} {listing.price}</p>}
      <p className="whitespace-pre-wrap">{listing.description}</p>

      <div className="border-t pt-4 space-y-2">
        <h2 className="font-semibold">Interested? Send an inquiry</h2>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          placeholder="Say something to the seller..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendInquiry} className="bg-black text-white px-4 py-2 rounded">
          Send inquiry
        </button>
        {status && <p className="text-sm text-neutral-600">{status}</p>}
      </div>
    </div>
  );
}
