const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.localStorage.getItem('accessToken');
}

export function logout() {
  if (typeof window !== 'undefined') window.localStorage.removeItem('accessToken');
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('accessToken');
  // NOTE: localStorage is used here for slice-1 simplicity only. Production should
  // move the access token to memory + an httpOnly refresh cookie, per the auth
  // architecture doc, to reduce XSS token-theft exposure.
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      // Token missing/expired/invalid — clear it so isLoggedIn() reflects reality
      // and the UI doesn't keep offering "logged in" actions with a dead token.
      logout();
    }
    throw new ApiError(body.message ?? `Request failed: ${res.status}`, res.status);
  }
  return res.json();
}

export const api = {
  register: (data: { email: string; password: string; displayName: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  searchListings: (q?: string) =>
    request(`/listings${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  getListing: (id: string) => request(`/listings/${id}`),

  createListing: (data: { title: string; description: string; price?: number }) =>
    request('/listings', { method: 'POST', body: JSON.stringify(data) }),

  publishListing: (id: string) => request(`/listings/${id}/publish`, { method: 'PATCH' }),

  createInquiry: (data: { listingId: string; message?: string }) =>
    request('/deals', { method: 'POST', body: JSON.stringify(data) }),

  myDeals: () => request('/deals'),

  transitionDeal: (dealId: string, toStage: string) =>
    request(`/deals/${dealId}/stage`, { method: 'PATCH', body: JSON.stringify({ toStage }) }),

  initiatePayment: (dealId: string, provider: 'STRIPE' | 'BTCPAY') =>
    request(`/deals/${dealId}/payment`, { method: 'POST', body: JSON.stringify({ provider }) }),
};
