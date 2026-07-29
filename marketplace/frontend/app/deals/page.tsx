'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, isLoggedIn, ApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SectionMarker } from '../../components/ui/SectionMarker';

type Deal = {
  id: string;
  stage: string;
  message: string | null;
  listing: { id: string; title: string };
  buyerId: string;
  sellerId: string;
};

const NEXT_CLIENT_STAGE: Record<string, { label: string; toStage: string }[]> = {
  INQUIRY: [
    { label: 'Move to negotiation', toStage: 'NEGOTIATION' },
    { label: 'Cancel', toStage: 'CANCELLED' },
  ],
  NEGOTIATION: [
    { label: 'Accept deal', toStage: 'ACCEPTED' },
    { label: 'Cancel', toStage: 'CANCELLED' },
  ],
  ACCEPTED: [{ label: 'Cancel', toStage: 'CANCELLED' }], // payment is its own button below
  AWAITING_PAYMENT: [{ label: 'Cancel', toStage: 'CANCELLED' }],
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null); // null = not checked yet
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.myDeals();
      setDeals(data);
    } catch (err: any) {
      // A 401 here means the token was missing/expired — api.ts already cleared it.
      setAuthed(false);
      setError(err.message ?? 'Could not load deals.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const loggedIn = isLoggedIn();
    setAuthed(loggedIn);
    if (loggedIn) {
      load();
    } else {
      setLoading(false); // don't even attempt the request — avoids the guaranteed 401
    }
  }, []);

  async function act(dealId: string, toStage: string) {
    setBusyId(dealId);
    setError(null);
    try {
      await api.transitionDeal(dealId, toStage);
      await load();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) setAuthed(false);
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function pay(dealId: string, provider: 'STRIPE' | 'BTCPAY') {
    setBusyId(dealId);
    setError(null);
    try {
      const result = await api.initiatePayment(dealId, provider);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl; // BTCPay hosted checkout
      } else {
        // Stripe: in a full build this hands clientSecret to Stripe Elements/
        // a Payment Element on this page. Kept as a placeholder here since
        // pulling in Stripe.js is its own small chunk of work.
        alert(
          'Stripe PaymentIntent created (client_secret returned). ' +
            'Next step: mount Stripe Elements here to collect card details.',
        );
      }
      await load();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) setAuthed(false);
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (authed === false) {
    return (
      <main className="mx-auto max-w-content px-6 py-16">
        <SectionMarker index="—" label="My deals" />
        <h1 className="mt-4 font-display text-display-md font-semibold tracking-tight">
          Log in to see your deals.
        </h1>
        <p className="mt-2 text-muted">Every negotiation and payment lives here once you're signed in.</p>
        <Link href="/login" className="mt-6 inline-block">
          <Button>Log in</Button>
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-content px-6 py-16">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-line bg-ink/[0.03]" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionMarker index="—" label="My deals" />
      <h1 className="mt-4 font-display text-display-md font-semibold tracking-tight">
        Your deal ledger.
      </h1>

      {error && (
        <p className="mt-4 rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {deals.length === 0 && !error && (
        <p className="mt-6 text-muted">No deals yet — inquiries you send or receive will show up here.</p>
      )}

      <div className="mt-8 space-y-3">
        {deals.map((d) => (
          <div key={d.id} className="space-y-3 rounded-lg border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{d.listing.title}</h3>
              <Badge tone={d.stage === 'PAID' ? 'verified' : d.stage === 'DISPUTED' ? 'danger' : 'neutral'}>
                {d.stage.replace('_', ' ')}
              </Badge>
            </div>
            {d.message && <p className="text-sm text-muted">"{d.message}"</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              {(NEXT_CLIENT_STAGE[d.stage] ?? []).map((action) => (
                <Button
                  key={action.toStage}
                  variant="secondary"
                  size="sm"
                  disabled={busyId === d.id}
                  onClick={() => act(d.id, action.toStage)}
                >
                  {action.label}
                </Button>
              ))}
              {d.stage === 'ACCEPTED' && (
                <>
                  <Button size="sm" disabled={busyId === d.id} onClick={() => pay(d.id, 'STRIPE')}>
                    Pay with card
                  </Button>
                  <Button
                    variant="brass"
                    size="sm"
                    disabled={busyId === d.id}
                    onClick={() => pay(d.id, 'BTCPAY')}
                  >
                    Pay with crypto
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
