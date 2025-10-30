const API_URL = import.meta.env.VITE_API_URL as string;

async function request(path: string, opts: RequestInit = {}){
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  listProducts: () => request('/products'),
  getProduct: (id: string) => request(`/product?id=${encodeURIComponent(id)}`),
  createProduct: (jwt: string, p: any) => request('/product', { method: 'POST', body: JSON.stringify(p), headers: { Authorization: jwt } }),
  getCart: (jwt: string) => request('/cart', { headers: { Authorization: jwt } }),
  addToCart: (jwt: string, productId: string, qty: number) => request('/cart', { method: 'POST', body: JSON.stringify({ productId, qty }), headers: { Authorization: jwt } }),
  removeFromCart: (jwt: string, productId: string) => request(`/cart?productId=${productId}`, { method: 'DELETE', headers: { Authorization: jwt } }),
  checkout: (jwt: string) => request('/checkout', { method: 'POST', headers: { Authorization: jwt } }),
  me: (jwt: string) => request('/user', { headers: { Authorization: jwt } }),
  analytics: (event: any) => request('/analytics', { method: 'POST', body: JSON.stringify(event) }),
};
