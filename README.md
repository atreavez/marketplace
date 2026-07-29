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

## Infrastructure (Module 1)
The backend now sits on top of a proper infrastructure layer instead of the
bare-bones bootstrap from earlier slices. None of this changed any feature
behavior — Auth/Listings/Deals/Payments work exactly as before, same routes,
same logic.

- **Config & validation** (`src/config/`) — env vars are validated with
  class-validator at boot (`env.validation.ts`); the app refuses to start
  with a clear error if something required is missing, instead of failing
  confusingly on the first request that touches it. `configuration.ts`
  exposes everything as a namespaced, typed object (`config.get('app.port')`)
  rather than feature code reaching into `process.env` directly.
- **Logging** — structured Pino logging (`nestjs-pino`), JSON in production
  / pretty-printed in dev, with auth headers and passwords redacted from
  logs by default. Every request gets a correlation ID.
- **Request IDs** — every response carries an `X-Request-Id` header (reuses
  an inbound one if a proxy already set it); the same ID shows up in every
  log line for that request, so a user-reported error can be grepped
  straight out of logs.
- **Global error handling** — one exception filter for the whole app,
  RFC7807-style `application/problem+json` responses. 5xx errors never leak
  internals (stack traces, DB error text) to the client; validation errors
  (4xx) return the actual field-level messages.
- **API versioning** — proper Nest URI versioning (`enableVersioning`)
  instead of a hardcoded prefix string. Produces the *exact same* routes as
  before (`/api/v1/...`) — verified no controller hardcodes its own prefix —
  but now a future `/api/v2/...` controller doesn't require an app-wide
  migration.
- **Health checks** — `GET /health/live` (liveness: is the process up) and
  `GET /health` (readiness: can Postgres and Redis actually be reached),
  both unversioned and outside the API prefix since infra probes shouldn't
  need to know the API version.
- **Redis** — `src/redis/` is a global module wrapping `ioredis`. Currently
  used for distributed rate-limit storage (see below) and health checks;
  available for caching/sessions in future modules without re-plumbing.
- **Rate limiting** — the existing Throttler setup now uses Redis-backed
  storage instead of in-memory, so limits are enforced correctly across
  multiple app instances behind a load balancer. Per-route limits on auth
  endpoints are unchanged.
- **Compression, Helmet, CORS** — gzip/brotli response compression added;
  Helmet and CORS configuration unchanged from before.
- **Prisma** — added query logging (dev-only) and a graceful-shutdown hook
  so the DB connection closes only after Nest finishes draining in-flight
  requests, not before.
- **Docker** — multi-stage `Dockerfile` for both backend and frontend
  (`dev` target for hot-reload, `production` target for a minimal deployable
  image, non-root user, healthcheck). `docker-compose.yml` now runs the full
  local stack: Postgres, Redis, backend, frontend.
- **Swagger/OpenAPI** — unchanged setup, now reflects the versioned API and
  bumped to reflect Payments being part of the documented surface.
- **ESLint + Prettier + Husky** — backend and frontend both lintable/
  formattable now (frontend had no ESLint config at all before); a root
  `package.json` hosts Husky + lint-staged so `git commit` lints and
  formats staged files automatically. This root `package.json` is
  tooling-only — it doesn't replace either app's own `package.json`, and
  each app is still installed/run independently.
- **Testing** — Jest was referenced in `package.json` scripts before but had
  **no actual Jest config**, so `npm test` would have failed to parse
  TypeScript at all; that's fixed. Added a real e2e smoke test
  (`test/app.e2e-spec.ts`) and a unit test for the deal state machine
  (`src/deals/deals.service.spec.ts`) — the most fraud-critical piece of
  logic in the app, now actually under test.
- **CI** (`.github/workflows/ci.yml`) — lint, format check, typecheck, unit
  tests, e2e tests (against real Postgres/Redis service containers), build,
  and a Docker build check, for both backend and frontend on every PR.

### What's deliberately NOT done here
The brief asked for "Clean Architecture" broadly. Full Clean Architecture
(entities/use-cases/interface-adapters layers inside every feature module)
would mean restructuring the already-working Auth/Listings/Deals/Payments
code — directly against "do not regenerate or redesign completed
functionality." Instead, Clean Architecture principles are applied at the
boundary that's safe to touch: cross-cutting infrastructure (config,
logging, error handling, health, Redis, Prisma) is isolated into its own
layer, injected via DI, and feature modules depend on it without knowing
its internals. The feature modules themselves keep their existing
controller/service/DTO structure — which is already a reasonable
feature-based organization — untouched. A deeper layering refactor inside
each feature module is a separate, larger piece of work if you want it.

### Running the full stack
```bash
docker compose up -d --build
```
This starts Postgres, Redis, the backend (hot-reload, port 4000), and the
frontend (hot-reload, port 3000). First run: exec into the backend
container (or run against `.env` locally) to run
`npx prisma migrate dev` and seed categories — migrations aren't run
automatically on container start in this setup.

## Identity & Authentication (Module 2)
Built on top of the existing Auth/Users modules — registration and login
keep their original request/response shape for existing callers (the
frontend's login/register pages work unmodified), everything else is new.

- **Registration / Login** — unchanged routes and behavior. Login now
  branches: if the account has 2FA enabled, it returns
  `{ twoFactorRequired: true, twoFactorToken }` instead of tokens, and the
  client completes login via `POST /auth/2fa/verify`.
- **JWT auth** — access tokens are still 15-minute JWTs, same shape
  (`userId`/`email`/`role` on `req.user`), so every existing
  `@CurrentUser()` consumer in Listings/Deals/Payments needed zero changes.
  Two additions: a token issued before a password change is now rejected
  even if not yet expired, and if the session backing a token has been
  revoked (logout), the token stops working immediately instead of waiting
  out its remaining lifetime.
- **Refresh tokens** — no longer a bare stateless JWT. Each device gets a
  `Session` row holding an opaque, rotated-on-use refresh token. Reusing an
  already-rotated token (a token-theft signal) kills the whole session
  defensively, not just that one request.
- **Logout** (`POST /auth/logout`) revokes one session by refresh token.
  **Logout all** (`POST /auth/logout-all`, authenticated) revokes every
  *other* session for the account, keeping the calling device logged in.
- **Email verification** — `POST /auth/verify-email/request` (authenticated)
  and `/confirm` (public, token-based). Registration still auto-logs-in and
  kicks off verification in parallel rather than gating login on it, to
  avoid changing existing behavior.
- **Password reset** — `POST /auth/password-reset/request` (public, always
  returns the same response whether or not the email exists — anti-
  enumeration) and `/confirm`. A successful reset revokes every session on
  the account.
- **Change password** (`POST /auth/change-password`, authenticated) — revokes
  every other session, keeps the current device logged in.
- **Two-factor auth (TOTP)** — `/auth/2fa/setup` (returns a QR code),
  `/enable` (confirms a live code, issues 10 backup codes shown exactly
  once), `/disable` (requires a live or backup code), `/verify` (completes
  a 2FA-gated login).
- **RBAC** — `@Roles()` decorator + `RolesGuard` exist
  (`src/auth/decorators`, `src/auth/guards`) but aren't applied to any
  existing route yet — available for future admin-only endpoints without
  touching this module again.
- **User profile** — `GET/PATCH /users/me` (authenticated). The pre-existing
  public `GET /users/:id` is untouched. Note: `me`-prefixed routes are
  declared *before* `:id` in the controller — Express matches path segments
  in registration order, so this ordering is load-bearing, not cosmetic.
- **Profile picture upload** — `POST /users/me/avatar` (multipart, 2MB
  limit, JPEG/PNG/WebP only), served back from `/uploads/avatars/...`.
  **Local disk storage** — documented in
  `users/avatar-upload.config.ts` as the swap point for S3-compatible
  object storage in production; won't survive a container restart or work
  across multiple app instances as-is.
- **Device management** — `GET /auth/sessions` lists active
  sessions/devices (marks which one is the caller's current device);
  `DELETE /auth/sessions/:id` revokes one.
- **Login history** — `GET /users/me/login-history` — every login attempt,
  successful or not, with reason/IP/user-agent.
- **Email sending is a stub** (`auth/mailer/mailer.service.ts`) — logs the
  email (including the full verification/reset link) instead of sending it,
  so the whole flow is testable with zero provider credentials. In non-
  production environments only, the verification/reset token is also
  returned directly in the API response (`devVerificationToken` /
  `devResetToken`) for the same reason. **Swap `MailerService.send` for a
  real provider before production** — nothing else in the flow needs to
  change.
- **Schema migration required** — `prisma/schema.prisma` gained new models
  (`Session`, `LoginHistoryEntry`, `EmailVerificationToken`,
  `PasswordResetToken`, `TwoFactorBackupCode`) and new `User` columns (all
  optional/defaulted, no backfill needed). Run
  `npx prisma migrate dev --name identity_auth_module` before starting the
  app — this wasn't run in this sandbox since there's no live database here.

## Fixes from initial run
Running Slice 1+2 for real surfaced two real bugs, now fixed:
- **Unhandled 401 crash on `/deals` and the listing detail page** — both
  fetched data in `useEffect` with no `.catch()`, so a missing/expired auth
  token threw an unhandled promise rejection instead of showing anything.
  `/deals` now checks auth state before fetching and shows a "log in first"
  screen; `api.ts` now exposes a typed `ApiError` (with `.status`) so pages
  can tell a 401 apart from other failures and clear the dead token.
- **Next.js 14 was EOL** (end of life Oct 2025, with real CVEs since) —
  bumped to Next.js 15.5.18 / React 19. This also required updating dynamic
  route pages for Next 15's async `params` (now a `Promise`, not a plain
  object) — `app/listings/[id]/page.tsx` was updated accordingly. Requires
  Node 18.18+ (Node 20 LTS recommended).

## Design system
The frontend now has a real, documented design system instead of default
Tailwind grey — built around one idea: this platform's actual product is a
deal ledger (INQUIRY → NEGOTIATION → ACCEPTED → PAID → RELEASED, the same
state machine from the Payments slice), so the visual identity makes that
trail visible rather than decorating on top of a generic template.

- **Tokens** — `app/globals.css` defines the full system as CSS custom
  properties (color, type, spacing, radius, shadow, motion), consumed by
  `tailwind.config.js`. Dark mode is a `.dark` class swap on `<html>`, same
  token names, different values — nothing in component code branches on
  light/dark.
- **Type** — Clash Display (headlines only, used sparingly), Switzer (UI/body),
  JetBrains Mono (prices, deal stages, stats — anything that's "data" reads
  as data).
- **Signature elements** — the hero's "ledger stub" search card (styled like
  a deal receipt, showing a live-looking INQUIRY→PAID trail) and the numbered
  `SectionMarker` rail that runs down the landing page (`01 · Discover`,
  `02 · Right now`, etc.) — both derived from the real Deal state machine,
  not generic decoration.
- **Components** — `components/ui/`: `Button` (4 variants), `Badge`, `Card`,
  `Input`, `SectionMarker`, `Swatch` (a deterministic gradient+icon
  placeholder standing in for listing photos — no fake product images).
- **Landing page** — `components/landing/`: Nav (glass, restrained to just
  this one spot), Hero, CategoryExplorer, Trending (tabbed — consolidates
  trending/featured/offers into one considered section instead of three
  shallow ones), AIRecommendations (horizontal rail, deliberately different
  layout rhythm from the grid above it), Sellers (tabbed top-rated/nearby),
  TrustStats (count-up numbers), Testimonials (single rotating editorial
  quote, not a 3-card grid), ClosingCTA (CTA + newsletter combined).
- **What's NOT restyled**: the functional flows (register/login/listings/
  deals) got a **light-touch pass** — same tokens and components so nothing
  clashes, but they weren't redesigned from scratch. The brief asked for the
  landing page first; these are next if you want the same level of craft
  applied there.
- **Fonts load from Fontshare/Google Fonts CDNs** — confirm those aren't
  blocked by your network/CSP before relying on them in production; self-host
  the font files if they need to be guaranteed available offline or IP-region-restricted.

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
