import './globals.css';
import { Nav } from '../components/landing/Nav';
import { Footer } from '../components/landing/Footer';

export const metadata = {
  title: 'Atreavez — One marketplace, anything worth trading.',
  description: 'Buy, sell, hire, and book — every deal tracked on an auditable ledger.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper font-body text-ink antialiased">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
