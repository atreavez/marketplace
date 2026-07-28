import Link from 'next/link';

const COLUMNS = [
  { title: 'Marketplace', links: ['Browse listings', 'Sell something', 'Categories', 'How escrow works'] },
  { title: 'Company', links: ['About', 'Careers', 'Press', 'Contact'] },
  { title: 'Trust & safety', links: ['Buyer protection', 'Seller verification', 'Dispute resolution', 'Report a listing'] },
  { title: 'Legal', links: ['Terms of service', 'Privacy policy', 'Cookie preferences'] },
];

export function Footer() {
  return (
    <footer className="bg-paper">
      <div className="mx-auto max-w-content px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="font-display text-lg font-semibold tracking-tight">Atreavez</div>
            <p className="mt-3 max-w-[20ch] text-sm text-muted">
              One ledger for everything you buy, sell, and trade.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-xs uppercase tracking-wider text-muted">{col.title}</div>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-ink/70 transition-colors hover:text-ink">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 md:flex-row">
          <span className="font-mono text-xs text-muted">
            © {new Date().getFullYear()} Atreavez General Technologies Ltd.
          </span>
          <span className="font-mono text-xs text-muted">Built on an auditable deal ledger.</span>
        </div>
      </div>
    </footer>
  );
}
