'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

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

  async function load() {
    const data = await api.myDeals();
    setDeals(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(dealId: string, toStage: string) {
    setBusyId(dealId);
    setError(null);
    try {
      await api.transitionDeal(dealId, toStage);
      await load();
    } catch (err: any) {
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
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Deals</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {deals.length === 0 && <p className="text-neutral-500">No deals yet.</p>}

      {deals.map((d) => (
        <div key={d.id} className="border rounded p-4 bg-white space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{d.listing.title}</h3>
            <span className="text-xs uppercase tracking-wide bg-neutral-100 px-2 py-1 rounded">
              {d.stage}
            </span>
          </div>
          {d.message && <p className="text-sm text-neutral-600">"{d.message}"</p>}

          <div className="flex gap-2 flex-wrap pt-2">
            {(NEXT_CLIENT_STAGE[d.stage] ?? []).map((action) => (
              <button
                key={action.toStage}
                disabled={busyId === d.id}
                onClick={() => act(d.id, action.toStage)}
                className="text-sm border rounded px-3 py-1 hover:bg-neutral-50 disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
            {d.stage === 'ACCEPTED' && (
              <>
                <button
                  disabled={busyId === d.id}
                  onClick={() => pay(d.id, 'STRIPE')}
                  className="text-sm bg-black text-white rounded px-3 py-1 disabled:opacity-50"
                >
                  Pay with card
                </button>
                <button
                  disabled={busyId === d.id}
                  onClick={() => pay(d.id, 'BTCPAY')}
                  className="text-sm bg-orange-500 text-white rounded px-3 py-1 disabled:opacity-50"
                >
                  Pay with crypto
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
