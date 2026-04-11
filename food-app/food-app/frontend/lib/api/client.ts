// API Client — Tất cả request từ frontend đều đi qua backend
// Frontend KHÔNG gọi trực tiếp tới ai-service

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ───────────────────────────────────────────

export interface OptionItem {
  name: string;
  price: number;
}

export interface OptionGroup {
  name: string;
  isRequired: boolean;
  isMultiple: boolean;
  choices: OptionItem[];
}

export interface SelectedOption {
  group: string;
  choice: string;
  price: number;
}

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
  storeId?: string | null;
  saleStartTime?: string | null;
  saleEndTime?: string | null;
  averageRating?: number;
  totalReviews?: number;
  options?: OptionGroup[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
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
  sellerReply?: string;
  replyAt?: string;
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
  search?: string;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters?.vegetarian) params.append('vegetarian', 'true');
  if (filters?.spicy !== undefined) params.append('spicy', filters.spicy ? 'true' : 'false');
  if (filters?.maxCalories) params.append('maxCalories', filters.maxCalories.toString());
  if (filters?.search) params.append('search', filters.search);
  
  const query = params.toString();
  return apiClient<Product[]>(`/products${query ? `?${query}` : ''}`);
}

// ─── Stores (For Customers) ──────────────────────────

export async function fetchStores(lat?: number, lng?: number): Promise<Store[]> {
  const params = new URLSearchParams();
  if (lat) params.append('lat', lat.toString());
  if (lng) params.append('lng', lng.toString());
  const query = params.toString();
  return apiClient<Store[]>(`/stores${query ? `?${query}` : ''}`);
}

export interface StoreDetail extends Store {
  products: Product[];
}

export async function fetchStoreById(id: string): Promise<StoreDetail> {
  return apiClient<StoreDetail>(`/stores/${id}`);
}

// ─── Coupons & Wishlist ──────────────────────────────

export interface CouponValidation {
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  discount: number;
  finalTotal: number;
}

export async function validateCoupon(code: string, orderTotal: number, token: string): Promise<CouponValidation> {
  return apiClient<CouponValidation>('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, orderTotal }),
    token,
  });
}

export interface CouponPublic {
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  expiresAt: string | null;
  storeId: string | null;
}

export interface CouponFull extends CouponPublic {
  id: string;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
  createdAt: string;
}

export async function fetchActiveCoupons(token: string, storeId?: string): Promise<CouponPublic[]> {
  const query = storeId ? `?storeId=${storeId}` : '';
  return apiClient<CouponPublic[]>(`/coupons${query}`, { token });
}

export async function fetchAdminCoupons(token: string): Promise<CouponFull[]> {
  return apiClient<CouponFull[]>('/coupons/admin', { token });
}

export async function createAdminCoupon(data: {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number | null;
  usageLimit?: number;
  expiresAt?: string | null;
}, token: string): Promise<CouponFull> {
  return apiClient<CouponFull>('/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function deleteAdminCoupon(id: string, token: string): Promise<void> {
  return apiClient<void>(`/coupons/${id}`, {
    method: 'DELETE',
    token,
  });
}

export interface WishlistItem extends Product {
  wishlistId: string;
  addedAt: string;
}

export async function fetchWishlist(token: string): Promise<WishlistItem[]> {
  return apiClient<WishlistItem[]>('/wishlist', { token });
}

export async function addToWishlist(productId: string, token: string) {
  return apiClient(`/wishlist/${productId}`, { method: 'POST', token });
}

export async function removeFromWishlist(productId: string, token: string) {
  return apiClient(`/wishlist/${productId}`, { method: 'DELETE', token });
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

export async function submitOrderReview(
  orderId: string,
  payload: { storeRating?: number; driverRating?: number; reviewComment?: string },
  token: string,
): Promise<Order> {
  return apiClient<Order>(`/orders/${orderId}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

// ─── AI Assistant ────────────────────────────────────

export async function sendChatMessage(message: string, token?: string): Promise<{ reply: string }> {
  return apiClient<{ reply: string }>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
    token, // Optional
  });
}

export async function searchSemanticProducts(query: string, token?: string): Promise<{ results: Product[]; query: string }> {
  return apiClient<{ results: Product[]; query: string }>(`/ai/search?q=${encodeURIComponent(query)}`, {
    token,
  });
}

// ─── Categories ─────────────────────────────────────────

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
  selectedOptions?: SelectedOption[];
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
  shippingFee?: number;
  discount?: number;
  couponCode?: string | null;
  note: string | null;
  deliveryAddress?: string;
  deliveryPhone?: string;
  paymentMethod?: string;
  store?: { name: string; address: string | null; phone: string | null };
  driver?: { id: string; name: string; phone: string | null };
  items: OrderItem[];
  history: OrderHistoryItem[];
  storeRating?: number | null;
  driverRating?: number | null;
  reviewComment?: string | null;
  createdAt: string;
}

export interface CreateOrderPayload {
  items: { 
    productId: string; 
    quantity: number; 
    note?: string;
    selectedOptions?: SelectedOption[];
  }[];
  address: string;
  paymentMethod: string;
  note?: string;
  couponCode?: string;
  userLat?: number;
  userLng?: number;
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

// ─── Profile ─────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
}

export async function fetchProfile(token: string): Promise<UserProfile> {
  return apiClient<UserProfile>('/users/me', { token });
}

export async function updateProfile(
  data: { name?: string; phone?: string; avatar?: string },
  token: string,
): Promise<UserProfile> {
  return apiClient<UserProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  token: string,
): Promise<{ message: string }> {
  return apiClient('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
    token,
  });
}

// ─── Admin User Management ───────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  _count: { orders: number };
}

export async function fetchAdminUsers(token: string, role?: string, blocked?: string): Promise<AdminUser[]> {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (blocked) params.append('blocked', blocked);
  const query = params.toString();
  return apiClient<AdminUser[]>(`/admin/users${query ? `?${query}` : ''}`, { token });
}

export async function updateUserRole(userId: string, role: string, token: string) {
  return apiClient(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
    token,
  });
}

export async function toggleBlockUser(userId: string, isBlocked: boolean, token: string) {
  return apiClient(`/admin/users/${userId}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ isBlocked }),
    token,
  });
}

// ─── Seller ──────────────────────────────────────────

export interface SellerStats {
  ordersToday: number;
  revenueToday: number;
  totalProducts: number;
  averageRating: number;
  totalOrders: number;
  chartData: { date: string; orders: number; revenue: number }[];
  topProducts: { name: string; totalSold: number }[];
}

export async function fetchSellerStats(token: string): Promise<SellerStats> {
  return apiClient<SellerStats>('/seller/stats', { token });
}

export interface SellerOrder extends Order {
  user: { name: string; email: string; phone: string | null };
}

export async function fetchSellerOrders(token: string): Promise<SellerOrder[]> {
  return apiClient<SellerOrder[]>('/seller/orders', { token });
}

export async function updateSellerOrderStatus(orderId: string, status: string, token: string) {
  return apiClient(`/seller/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    token,
  });
}

export async function rejectSellerOrder(orderId: string, reason: string, token: string) {
  return apiClient(`/seller/orders/${orderId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
    token,
  });
}

export async function fetchSellerProducts(token: string): Promise<Product[]> {
  return apiClient<Product[]>('/seller/products', { token });
}

export async function createSellerProduct(payload: Partial<Product>, token: string): Promise<Product> {
  return apiClient<Product>('/seller/products', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateSellerProduct(id: string, payload: Partial<Product>, token: string): Promise<Product> {
  return apiClient<Product>(`/seller/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  });
}

export async function toggleSellerProduct(productId: string, token: string) {
  return apiClient(`/seller/products/${productId}/toggle`, {
    method: 'PATCH',
    token,
  });
}

export async function deleteSellerProduct(productId: string, token: string) {
  return apiClient(`/seller/products/${productId}`, {
    method: 'DELETE',
    token,
  });
}

export interface Store {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  coverImage: string | null;
  address: string | null;
  lat?: number | null;
  lng?: number | null;
  phone: string | null;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  rating: number;
  totalOrders: number;
  distance?: number;
}


export async function fetchSellerStore(token: string): Promise<Store> {
  return apiClient<Store>('/seller/store', { token });
}

export async function updateSellerStore(data: Partial<Store>, token: string): Promise<Store> {
  return apiClient<Store>('/seller/store', {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

export async function toggleSellerStore(token: string): Promise<Store> {
  return apiClient<Store>('/seller/store/toggle', {
    method: 'PATCH',
    token,
  });
}

// ─── Driver ──────────────────────────────────────────

export interface DriverOrder {
  id: string;
  total: number;
  shippingFee: number;
  deliveryAddress: string | null;
  deliveryPhone: string | null;
  paymentMethod: string;
  status: string;
  createdAt: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    phone: string | null;
  };
  store?: {
    name: string;
    address: string | null;
    phone: string | null;
  };
}

export async function fetchAvailableOrders(token: string): Promise<DriverOrder[]> {
  return apiClient<DriverOrder[]>('/driver/available-orders', { token });
}

export async function acceptOrder(orderId: string, token: string): Promise<DriverOrder> {
  return apiClient<DriverOrder>(`/driver/orders/${orderId}/accept`, {
    method: 'POST',
    token,
  });
}

export async function completeOrder(orderId: string, token: string): Promise<DriverOrder> {
  return apiClient<DriverOrder>(`/driver/orders/${orderId}/complete`, {
    method: 'PATCH',
    token,
  });
}

export async function fetchDriverMyOrders(token: string): Promise<DriverOrder[]> {
  return apiClient<DriverOrder[]>('/driver/orders/my-orders', { token });
}

export const api = { baseUrl: API_BASE_URL };

export async function uploadImage(file: File, token: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!res.ok) {
    throw new Error('Upload failed');
  }
  return res.json();
}
