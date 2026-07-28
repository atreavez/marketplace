# Universal Marketplace — Slice 1 + Slice 2

This is a **real, working codebase**, built incrementally:
- **Slice 1**: Auth → Listings → Search → Deal Inquiry
- **Slice 2**: Payments (Stripe for cards, BTCPay Server for crypto), wired into
  the deal state machine

It is not the full platform described in the architecture doc, and it is not
production-ready on its own — see "What's not here yet" below before you
point real users or real money at it.

## What actually works here
- User registration/login with Argon2id password hashing + JWT (15-min access
  token, 7-day refresh token issued but not yet rotated/revocable — see below)
- Rate limiting on auth endpoints
- Listings: create (draft), publish, fetch by ID, search (Postgres full-text,
  filterable by category/price)
- Deals: buyer opens an inquiry on an active listing, stage transitions are
  enforced by an explicit **two-tier state machine**:
  - client-facing transitions (buyer/seller, via `PATCH /deals/:id/stage`):
    INQUIRY → NEGOTIATION → ACCEPTED → AWAITING_PAYMENT, CANCELLED at any point,
    DISPUTED once PAID
  - system-only transitions (server code that has independently verified
    something external — never reachable from a client request body):
    AWAITING_PAYMENT → PAID (only from a verified payment webhook),
    PAID/DISPUTED → RELEASED/REFUNDED (only from admin resolution — not yet
    implemented, see below)
  - every transition, client or system, is written to an immutable
    `deal_events` audit table
- **Payments**: buyer pays for an ACCEPTED deal via Stripe (PaymentIntent) or
  BTCPay Server (hosted invoice). Webhook signatures are verified
  (Stripe's HMAC scheme, BTCPay's `BTCPAY-SIG` HMAC) before any state changes;
  webhook handlers are idempotent so provider retries are safe. A confirmed
  webhook is the *only* code path in the entire app that can mark a deal PAID.
- Input validation (class-validator) and mass-assignment protection
  (whitelist-only DTOs) on every endpoint
- Swagger/OpenAPI docs auto-generated at `/api/docs`
- A minimal Next.js frontend: browse/search/create listings, send inquiries,
  and on the new **My Deals** page, walk a deal through its stages and pay
  with card or crypto

## What's NOT here yet (do not launch without these)
- **No escrow release/dispute-resolution logic** — PAID deals can be marked
  DISPUTED by either party, but nothing currently moves a disputed or paid
  deal to RELEASED/REFUNDED; that's an admin panel feature to build next
- **Stripe checkout is not fully wired on the frontend** — the backend
  correctly creates a PaymentIntent and returns `client_secret`, but the page
  currently just alerts it instead of mounting Stripe Elements/Payment
  Element to actually collect card details. BTCPay's hosted checkout *is*
  fully wired (redirects to BTCPay's page).
- **No auto-release timer** for payments (e.g., auto-release to seller after
  N days with no dispute) — designed in the architecture doc, not built
- **No chat** — inquiries are one-shot messages, not a conversation
- **No AI** — no listing assist, no fraud/duplicate detection, no
  recommendations
- **No notifications** (including "payment confirmed" — right now you have
  to reload the My Deals page to see PAID)
- **No refresh-token rotation/revocation, no WebAuthn/passkeys, no 2FA**
- **No admin panel, no moderation queue**
- **No Tor hidden service, no privacy dashboard**
- **No automated tests included in this pass**
- **Dependencies have not been installed or run in this environment** — same
  caveat as Slice 1: this is carefully written, unexecuted code. The payments
  webhook flow in particular needs real testing against Stripe's CLI
  (`stripe listen --forward-to`) and a BTCPay testnet store before you trust
  it with real money.

## Running it locally

### 1. Database
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env      # then edit JWT_SECRET to something random
npm install
npm run prisma:generate
npm run prisma:migrate    # creates tables
npx ts-node prisma/seed.ts
npm run start:dev         # http://localhost:4000, docs at /api/docs
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                # http://localhost:3000
```

### 4. Payment providers (needed to test Slice 2)
- **Stripe**: create a free test-mode account, grab the secret key, and run
  `stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe` (Stripe
  CLI) — it prints a webhook signing secret, put that in `STRIPE_WEBHOOK_SECRET`.
- **BTCPay**: easiest path for local testing is BTCPay's own demo/testnet
  instance, or self-host via their docker-compose. Create a store, an API key
  with invoice-create permission, and a webhook pointed at
  `{your-ngrok-or-tunnel-url}/api/v1/webhooks/btcpay` with the "Invoice
  settled" and "Invoice expired/invalid" events checked.

### 5. Try it
1. Sign up at `/register`
2. Create a listing **with a price** at `/listings/new`
3. Log in as a second user, browse `/listings`, open the listing, send an
   inquiry
4. Go to `/deals`, walk the deal: negotiation → accept
5. Click "Pay with crypto" — you'll be redirected to BTCPay's hosted checkout;
   pay on testnet, then reload `/deals` and the stage should read `PAID`
   (via the webhook, not the page — this proves the webhook path works)
6. For Stripe, "Pay with card" currently just shows you the PaymentIntent's
   client_secret in an alert — see "What's NOT here yet"

## Suggested next slice
Two reasonable options from here:
- **Admin/dispute resolution** — closes the loop on PAID → RELEASED/REFUNDED,
  which is currently a dead end
- **Chat** — buyers and sellers currently can only exchange one message via
  the inquiry; real negotiation needs a conversation

AI listing-assist is a good third option since it doesn't block on either of
the above.
