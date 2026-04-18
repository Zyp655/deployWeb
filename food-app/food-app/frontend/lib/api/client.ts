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
  salePrice?: number | null;
  flashSaleStart?: string | null;
  flashSaleEnd?: string | null;
  averageRating?: number;
  totalReviews?: number;
  options?: OptionGroup[];
}

export interface FlashSaleProduct extends Product {
  salePrice: number;
  flashSaleStart: string;
  flashSaleEnd: string;
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
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
      window.dispatchEvent(new Event('storage'));
    }
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

export async function fetchFlashSaleProducts(): Promise<FlashSaleProduct[]> {
  return apiClient<FlashSaleProduct[]>('/products/flash-sales');
}

// ─── Stores (For Customers) ──────────────────────────

export async function fetchStores(lat?: number, lng?: number, tag?: string): Promise<Store[]> {
  const params = new URLSearchParams();
  if (lat) params.append('lat', lat.toString());
  if (lng) params.append('lng', lng.toString());
  if (tag) params.append('tag', tag);
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
  payload: { storeRating?: number; driverRating?: number; reviewComment?: string; driverTip?: number },
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

export async function fetchSearchSuggestions(query: string): Promise<{ products: Partial<Product>[]; stores: Partial<Store>[] }> {
  return apiClient<{ products: Partial<Product>[]; stores: Partial<Store>[] }>(`/products/search/suggest?q=${encodeURIComponent(query)}`);
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

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiClient('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  email: string,
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  return apiClient('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, token, newPassword }),
  });
}

// ─── Orders ──────────────────────────────────────────

export interface OrderItem {
  id: string;
  productName: string;
  productImage?: string;
  productCategory?: string;
  productId?: string;
  quantity: number;
  price: number;
  selectedOptions?: SelectedOption[];
  product?: Product;
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
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  paymentMethod?: string;
  store?: { name: string; address: string | null; phone: string | null; lat?: number | null; lng?: number | null };
  driver?: { id: string; name: string; phone: string | null };
  items: OrderItem[];
  history: OrderHistoryItem[];
  storeRating?: number | null;
  driverRating?: number | null;
  reviewComment?: string | null;
  scheduledAt?: string | null;
  isScheduled?: boolean;
  refundStatus?: string;
  refundedAt?: string | null;
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
  scheduledAt?: string;
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

export async function cancelOrder(
  orderId: string,
  reason: string,
  token: string,
): Promise<{ id: string; status: string; message: string; refunded: boolean }> {
  return apiClient(`/orders/${orderId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
    token,
  });
}

export async function fetchMyOrdersPaginated(
  token: string,
  params?: { status?: string; search?: string; page?: number; limit?: number },
): Promise<Order[]> {
  const orders = await apiClient<Order[]>('/orders/my', { token });
  let filtered = orders;
  if (params?.status && params.status !== 'ALL') {
    filtered = filtered.filter(o => o.status === params.status);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.store?.name?.toLowerCase().includes(q) ||
      o.items.some(i => i.productName.toLowerCase().includes(q))
    );
  }
  return filtered;
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

export async function createSepayPayment(
  orderId: string,
  amount: number,
  token: string,
): Promise<{ success: boolean; qrUrl: string; bankName: string; accountNumber: string; content: string }> {
  return apiClient('/payments/sepay/create', {
    method: 'POST',
    body: JSON.stringify({ orderId, amount }),
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

export interface SellerAdvancedStats {
  topCustomers: { name: string; email: string; totalOrders: number; totalSpent: number }[];
  conversion: { delivered: number; cancelled: number; pending: number; rate: number };
  comparison: {
    weekly: {
      thisWeek: { orders: number; revenue: number };
      lastWeek: { orders: number; revenue: number };
      change: { orders: number; revenue: number };
    };
    monthly: {
      thisMonth: { orders: number; revenue: number };
      lastMonth: { orders: number; revenue: number };
      change: { orders: number; revenue: number };
    };
  };
  heatmap: { hour: number; count: number }[];
}

export async function fetchSellerStats(token: string): Promise<SellerStats> {
  return apiClient<SellerStats>('/seller/stats', { token });
}

export async function fetchSellerAdvancedStats(token: string): Promise<SellerAdvancedStats> {
  return apiClient<SellerAdvancedStats>('/seller/stats/advanced', { token });
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

export async function confirmSellerRefund(orderId: string, token: string) {
  return apiClient(`/seller/orders/${orderId}/refund`, {
    method: 'PATCH',
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

// ─── Partner Requests ──────────────────────────────────
export async function createPartnerRequest(payload: any, token: string): Promise<any> {
  return apiClient('/partner-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export async function fetchMyPartnerRequests(token: string): Promise<any[]> {
  return apiClient<any[]>('/partner-requests/my-requests', { token });
}

export async function fetchAdminPartnerRequests(token: string): Promise<any[]> {
  return apiClient<any[]>('/admin/partner-requests', { token });
}

export async function approvePartnerRequest(id: string, token: string): Promise<any> {
  return apiClient(`/admin/partner-requests/${id}/approve`, {
    method: 'PATCH',
    token,
  });
}

export async function rejectPartnerRequest(id: string, reason: string | null, token: string): Promise<any> {
  return apiClient(`/admin/partner-requests/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
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
  tags?: string[];
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

export interface DriverProfile {
  id: string;
  userId: string;
  vehicleType: string;
  vehiclePlate: string | null;
  idCardNumber: string | null;
  isOnline: boolean;
  isVerified: boolean;
  currentLat: number | null;
  currentLng: number | null;
  totalDeliveries: number;
  averageRating: number;
  totalEarnings: number;
  acceptanceRate: number;
  user?: { id: string; name: string; email: string; phone: string | null; avatar: string | null };
}

export interface DriverOrder {
  id: string;
  total: number;
  shippingFee: number;
  deliveryAddress: string | null;
  deliveryPhone: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  paymentMethod: string;
  status: string;
  note: string | null;
  createdAt: string;
  userId: string;
  distanceToStore?: number | null;
  user?: {
    id: string;
    name: string;
    phone: string | null;
  };
  store?: {
    name: string;
    address: string | null;
    phone: string | null;
    lat?: number | null;
    lng?: number | null;
  };
  items?: {
    id: string;
    quantity: number;
    price: number;
    product: { name: string; image?: string | null };
  }[];
  earning?: DriverEarning | null;
}

export interface DriverEarning {
  id: string;
  baseFee: number;
  tip: number;
  bonus: number;
  totalFee: number;
  createdAt: string;
}

export interface DriverTodayEarnings {
  totalOrders: number;
  totalBaseFee: number;
  totalTip: number;
  totalBonus: number;
  total: number;
  avgPerOrder: number;
  isPeakHour: boolean;
}

export interface DriverEarningsSummary {
  chartData: { date: string; orders: number; total: number }[];
  totalEarnings: number;
  totalOrders: number;
  averageRating: number;
  totalDeliveries: number;
  acceptanceRate: number;
}

export async function registerDriver(
  data: { vehicleType?: string; vehiclePlate?: string; idCardNumber?: string },
  token: string,
): Promise<DriverProfile> {
  return apiClient<DriverProfile>('/driver/register', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function fetchDriverProfile(token: string): Promise<DriverProfile> {
  return apiClient<DriverProfile>('/driver/profile', { token });
}

export async function updateDriverProfile(
  data: { vehicleType?: string; vehiclePlate?: string; idCardNumber?: string },
  token: string,
): Promise<DriverProfile> {
  return apiClient<DriverProfile>('/driver/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

export async function toggleDriverOnline(token: string): Promise<DriverProfile> {
  return apiClient<DriverProfile>('/driver/toggle-online', {
    method: 'POST',
    token,
  });
}

export async function updateDriverLocation(lat: number, lng: number, token: string) {
  return apiClient('/driver/update-location', {
    method: 'POST',
    body: JSON.stringify({ lat, lng }),
    token,
  });
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

export async function pickedUpOrder(orderId: string, token: string): Promise<DriverOrder> {
  return apiClient<DriverOrder>(`/driver/orders/${orderId}/picked`, {
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

export async function rejectDriverOrder(orderId: string, reason: string, token: string) {
  return apiClient(`/driver/orders/${orderId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    token,
  });
}

export async function fetchActiveDelivery(token: string): Promise<DriverOrder | null> {
  return apiClient<DriverOrder | null>('/driver/orders/active', { token });
}

export async function fetchDriverMyOrders(
  token: string,
  page = 1,
  limit = 20,
): Promise<{ orders: DriverOrder[]; total: number; page: number; totalPages: number }> {
  return apiClient(`/driver/orders/my-orders?page=${page}&limit=${limit}`, { token });
}

export async function fetchTodayEarnings(token: string): Promise<DriverTodayEarnings> {
  return apiClient<DriverTodayEarnings>('/driver/earnings/today', { token });
}

export async function fetchEarningsSummary(token: string, days = 7): Promise<DriverEarningsSummary> {
  return apiClient<DriverEarningsSummary>(`/driver/earnings/summary?days=${days}`, { token });
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

// ─── Wallet & Withdrawals ──────────────────────────────

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  orderId?: string | null;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  frozenBalance: number;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
  createdAt: string;
  updatedAt: string;
  transactions?: WalletTransaction[];
}

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  wallet?: {
    bankName: string | null;
    bankAccount: string | null;
    bankAccountName: string | null;
    user?: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      role: string;
    };
  };
}

export async function fetchMyWallet(token: string): Promise<Wallet> {
  return apiClient<Wallet>('/wallet/me', { token });
}

export async function updateBankAccount(data: { bankName: string; bankAccount: string; bankAccountName: string }, token: string): Promise<Wallet> {
  return apiClient<Wallet>('/wallet/me/bank', {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

export async function requestWithdrawal(amount: number, token: string): Promise<WithdrawalRequest> {
  return apiClient<WithdrawalRequest>('/withdrawals', {
    method: 'POST',
    body: JSON.stringify({ amount }),
    token,
  });
}

export async function fetchAdminWithdrawals(token: string): Promise<WithdrawalRequest[]> {
  return apiClient<WithdrawalRequest[]>('/admin/withdrawals', { token });
}

export async function approveWithdrawal(id: string, token: string): Promise<WithdrawalRequest> {
  return apiClient<WithdrawalRequest>(`/admin/withdrawals/${id}/approve`, {
    method: 'PATCH',
    token,
  });
}

export async function rejectWithdrawal(id: string, adminNote: string, token: string): Promise<WithdrawalRequest> {
  return apiClient<WithdrawalRequest>(`/admin/withdrawals/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ adminNote }),
    token,
  });
}

export async function confirmAdminRefund(orderId: string, token: string) {
  return apiClient(`/admin/orders/${orderId}/refund`, {
    method: 'PATCH',
    token,
  });
}

