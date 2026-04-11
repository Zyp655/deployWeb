// API Client — Tất cả request từ frontend đều đi qua backend
// Frontend KHÔNG gọi trực tiếp tới ai-service

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ───────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
  isAvailable: boolean;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  calories?: number | null;
  tags?: string[];
  averageRating?: number;
  totalReviews?: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string };
}

export interface ProductRating {
  averageRating: number;
  totalReviews: number;
}

export interface ProductDetail extends Product {
  reviews: Review[];
}

// ─── API Client ──────────────────────────────────────

async function apiClient<T>(
  endpoint: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ─── Products ────────────────────────────────────────

export async function fetchProducts(filters?: {
  vegetarian?: boolean;
  spicy?: boolean;
  maxCalories?: number;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters?.vegetarian) params.append('vegetarian', 'true');
  if (filters?.spicy !== undefined) params.append('spicy', filters.spicy ? 'true' : 'false');
  if (filters?.maxCalories) params.append('maxCalories', filters.maxCalories.toString());
  
  const query = params.toString();
  return apiClient<Product[]>(`/products${query ? `?${query}` : ''}`);
}

export async function fetchProductById(id: string): Promise<ProductDetail> {
  return apiClient<ProductDetail>(`/products/${id}`);
}

export interface RecommendedProduct extends Product {
  recommendReason: string;
}

export async function fetchRecommendedProducts(token?: string): Promise<RecommendedProduct[]> {
  return apiClient<RecommendedProduct[]>('/products/recommended', { token });
}

// ─── Reviews ─────────────────────────────────────────

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  return apiClient<Review[]>(`/products/${productId}/reviews`);
}

export async function fetchProductRating(productId: string): Promise<ProductRating> {
  return apiClient<ProductRating>(`/products/${productId}/rating`);
}

export async function createReview(
  productId: string,
  rating: number,
  comment: string,
  token: string,
): Promise<Review> {
  return apiClient<Review>('/reviews', {
    method: 'POST',
    body: JSON.stringify({ productId, rating, comment }),
    token,
  });
}

// ─── Auth ────────────────────────────────────────────

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ─── Orders ──────────────────────────────────────────

export interface OrderItem {
  id: string;
  productName: string;
  productImage?: string;
  productCategory?: string;
  quantity: number;
  price: number;
}

export interface OrderHistoryItem {
  status: string;
  note?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  status: string;
  total: number;
  note: string | null;
  address?: string;
  paymentMethod?: string;
  items: OrderItem[];
  history: OrderHistoryItem[];
  createdAt: string;
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number; note?: string }[];
  address: string;
  paymentMethod: string;
  note?: string;
}

export async function createOrder(
  payload: CreateOrderPayload,
  token: string,
): Promise<Order> {
  return apiClient<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export async function fetchMyOrders(token: string): Promise<Order[]> {
  return apiClient<Order[]>('/orders/my', { token });
}

export async function fetchOrderById(
  orderId: string,
  token: string,
): Promise<Order> {
  return apiClient<Order>(`/orders/${orderId}`, { token });
}

// ─── Admin Dashboard ─────────────────────────────────

export interface AdminStats {
  totalOrders: number;
  revenueToday: number;
  totalUsers: number;
  totalProducts: number;
  chartData: { date: string; orders: number; revenue: number }[];
}

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  return apiClient<AdminStats>('/admin/stats', { token });
}

export async function fetchAdminOrders(token: string): Promise<Order[]> {
  return apiClient<Order[]>('/admin/orders', { token });
}

export async function updateOrderStatus(orderId: string, status: string, token: string): Promise<Order> {
  return apiClient<Order>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    token,
  });
}

export async function createAdminProduct(payload: Partial<Product>, token: string): Promise<Product> {
  return apiClient<Product>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateAdminProduct(id: string, payload: Partial<Product>, token: string): Promise<Product> {
  return apiClient<Product>(`/admin/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  });
}

// ─── Payments ────────────────────────────────────────

export async function createMoMoPayment(
  orderId: string,
  amount: number,
  orderInfo: string,
  token: string,
): Promise<{ payUrl: string; deeplink: string; qrCodeUrl: string }> {
  return apiClient('/payments/momo/create', {
    method: 'POST',
    body: JSON.stringify({ orderId, amount, orderInfo }),
    token,
  });
}

export async function createVNPayPayment(
  orderId: string,
  amount: number,
  orderInfo: string,
  token: string,
): Promise<{ paymentUrl: string }> {
  return apiClient('/payments/vnpay/create', {
    method: 'POST',
    body: JSON.stringify({ orderId, amount, orderInfo }),
    token,
  });
}
