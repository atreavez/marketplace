# Universal Marketplace — Slice 1

This is a **real, working codebase** for the first vertical slice of the
platform: **Auth → Listings → Search → Deal Inquiry**. It is not the full
platform described in the architecture doc, and it is not production-ready
on its own — see "What's not here yet" below before you point real users
or real money at it.

## What actually works here
- User registration/login with Argon2id password hashing + JWT (15-min access
  token, 7-day refresh token issued but not yet rotated/revocable — see below)
- Rate limiting on auth endpoints
- Listings: create (draft), publish, fetch by ID, search (Postgres full-text,
  filterable by category/price)
- Deals: buyer opens an inquiry on an active listing, stage transitions are
  enforced by an explicit state machine (INQUIRY → NEGOTIATION → ACCEPTED, or
  → CANCELLED at any point), every transition is written to an immutable
  `deal_events` audit table
- Input validation (class-validator) and mass-assignment protection
  (whitelist-only DTOs) on every endpoint
- Swagger/OpenAPI docs auto-generated at `/api/docs`
- A minimal Next.js frontend that exercises all of the above

## What's NOT here yet (do not launch without these)
- **No payments, no escrow, no crypto integration** — deals stop at ACCEPTED
- **No chat** — inquiries are one-shot messages, not a conversation
- **No AI** — no listing assist, no fraud/duplicate detection, no
  recommendations
- **No notifications**
- **No refresh-token rotation/revocation** (Redis-backed session tracking is
  designed but not implemented — right now a stolen refresh token is valid
  until it expires)
- **No WebAuthn/passkeys, no 2FA**
- **No admin panel, no moderation queue**
- **No Tor hidden service, no privacy dashboard**
- **No automated tests included in this pass** — the testing strategy doc
  describes what should exist; none of it has been written yet
- **Dependencies have not been installed or run in this environment** — I
  wrote this code carefully but have not executed `npm install` / booted the
  server here, so treat it as "should work, needs a first real run" rather
  than "verified working." Run it locally and tell me what breaks.

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

### 4. Try it
1. Sign up at `/register`
2. Create a listing at `/listings/new`
3. Log in as a second user, browse `/listings`, open the listing, send an
   inquiry
4. Check the deal via `GET /api/v1/deals` (bearer token required) — you'll
   see the `INQUIRY` stage and its audit event

## Suggested next slice
Once you've run this and confirmed it behaves the way you expect, the
natural next slice is **Payments** (Stripe first, then one crypto broker —
BTCPay is the cheapest to self-host) so a Deal can actually move past
ACCEPTED. Chat and AI listing-assist are good candidates after that, since
neither blocks the other.
