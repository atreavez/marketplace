import { randomBytes, createHash } from 'crypto';

// High-entropy opaque tokens (not JWTs) for refresh/verification/reset —
// these are bearer secrets, not claims that need to be self-describing, so
// a random string plus a server-side DB lookup is simpler and more easily
// revocable than a signed token would be.
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

// SHA-256, not Argon2id, is deliberate: these tokens are already
// high-entropy random data (not a user-chosen low-entropy secret like a
// password), so a slow KDF adds latency without adding real resistance to
// brute force — a fast cryptographic hash is the standard, correct choice
// for this case and is what lets us look tokens up by hash efficiently.
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
