'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SectionMarker } from '../../components/ui/SectionMarker';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken } = await api.login(form);
      window.localStorage.setItem('accessToken', accessToken);
      router.push('/listings');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-content px-6 py-20">
      <div className="mx-auto max-w-sm">
        <SectionMarker index="—" label="Welcome back" />
        <h1 className="mt-4 font-display text-display-md font-semibold tracking-tight">
          Log in
        </h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error && (
            <p className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{' '}
          <Link href="/register" className="text-ink underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
