const SESSION_KEY = 'shop_session_id';

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': getSessionId(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getMe: () => request('/api/auth/me'),

  // Products
  getProducts: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id) => request(`/api/products/${id}`),
  getCategories: () => request('/api/categories'),

  // Reviews
  getReviews: (productId) => request(`/api/products/${productId}/reviews`),
  getReviewStats: (productId) => request(`/api/products/${productId}/reviews/stats`),
  addReview: (productId, data) =>
    request(`/api/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
  deleteReview: (id) => request(`/api/reviews/${id}`, { method: 'DELETE' }),

  // Cart
  getCart: () => request('/api/cart'),
  addToCart: (product_id, quantity = 1) =>
    request('/api/cart', { method: 'POST', body: JSON.stringify({ product_id, quantity }) }),
  updateCartItem: (id, quantity) =>
    request(`/api/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeFromCart: (id) => request(`/api/cart/${id}`, { method: 'DELETE' }),

  // Checkout
  checkout: (data) => request('/api/checkout', { method: 'POST', body: JSON.stringify(data) }),
  getOrder: (id) => request(`/api/orders/${id}`),

  // Admin
  getAdminProducts: () => request('/api/admin/products'),
  createProduct: (data) => request('/api/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/api/admin/products/${id}`, { method: 'DELETE' }),
  getAdminOrders: () => request('/api/admin/orders'),
  updateOrderStatus: (id, status) =>
    request(`/api/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAdminStats: () => request('/api/admin/stats'),
};
