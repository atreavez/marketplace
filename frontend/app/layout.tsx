import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'Marketplace — Slice 1' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <nav className="border-b bg-white px-6 py-4 flex gap-6 items-center">
          <Link href="/listings" className="font-semibold">Marketplace</Link>
          <Link href="/listings">Browse</Link>
          <Link href="/listings/new">Sell something</Link>
          <Link href="/deals">My Deals</Link>
          <div className="ml-auto flex gap-4">
            <Link href="/login">Log in</Link>
            <Link href="/register">Sign up</Link>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
