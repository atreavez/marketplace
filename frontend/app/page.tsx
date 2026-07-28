import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Universal Marketplace — Slice 1</h1>
      <p className="text-neutral-600">
        Auth, listings, search, and deal inquiries. Payments, chat, and AI are not wired up yet.
      </p>
      <Link href="/listings" className="inline-block bg-black text-white px-4 py-2 rounded">
        Browse listings
      </Link>
    </div>
  );
}
