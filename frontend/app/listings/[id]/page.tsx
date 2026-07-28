'use client';
import { useEffect, useState } from 'react';
import { Package, ShieldCheck } from 'lucide-react';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Swatch } from '../../../components/ui/Swatch';
import { Badge } from '../../../components/ui/Badge';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [listing, setListing] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    api
      .getListing(id)
      .then(setListing)
      .catch((err) => setLoadError(err.message ?? 'Listing not found.'));
  }, [id]);

  async function sendInquiry() {
    if (!id) return;
    setStatus(null);
    try {
      await api.createInquiry({ listingId: id, message });
      setStatus('Inquiry sent — check "My Deals" for updates.');
    } catch (err: any) {
      setStatus(err.message ?? 'Could not send inquiry. Are you logged in?');
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-content px-6 py-16">
        <p className="rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {loadError}
        </p>
      </main>
    );
  }
  if (!listing) {
    return (
      <main className="mx-auto max-w-content px-6 py-16">
        <div className="h-72 max-w-2xl animate-pulse rounded-lg border border-line bg-ink/[0.03]" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <div className="grid max-w-3xl gap-8 md:grid-cols-[1fr_1.2fr]">
        <Swatch seed={listing.title} icon={Package} className="h-56 w-full rounded-lg md:h-full" />

        <div>
          <Badge tone="verified">
            <ShieldCheck className="h-3 w-3" /> Escrow-protected
          </Badge>
          <h1 className="mt-4 font-display text-display-md font-semibold tracking-tight">
            {listing.title}
          </h1>
          <p className="mt-1 text-sm text-muted">Listed by {listing.seller.displayName}</p>
          {listing.price && (
            <p className="mt-4 font-mono text-2xl">
              {listing.currency} {listing.price}
            </p>
          )}
          <p className="mt-6 whitespace-pre-wrap leading-relaxed text-ink/80">
            {listing.description}
          </p>

          <div className="mt-8 space-y-3 border-t border-line pt-6">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted">
              Interested? Send an inquiry
            </h2>
            <textarea
              className="w-full rounded-md border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus-visible:border-verified"
              rows={3}
              placeholder="Say something to the seller..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={sendInquiry}>Send inquiry</Button>
            {status && <p className="text-sm text-muted">{status}</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
