'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { accessToken } = await api.register(form);
      window.localStorage.setItem('accessToken', accessToken);
      router.push('/listings');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Create account</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input
        className="w-full border rounded p-2"
        placeholder="Display name"
        value={form.displayName}
        onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        required
      />
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
        placeholder="Password (min 12 chars)"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      <button className="bg-black text-white px-4 py-2 rounded w-full">Sign up</button>
    </form>
  );
}
