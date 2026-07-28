'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { accessToken } = await api.login(form);
      window.localStorage.setItem('accessToken', accessToken);
      router.push('/listings');
    } catch {
      setError('Invalid credentials');
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Log in</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input
        className="w-full border rounded p-2"
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        className="w-full border rounded p-2"
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      <button className="bg-black text-white px-4 py-2 rounded w-full">Log in</button>
    </form>
  );
}
