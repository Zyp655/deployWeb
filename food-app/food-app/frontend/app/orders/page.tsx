'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { fetchMyOrdersPaginated, Order } from '@/lib/api/client';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả', icon: '📋' },
  { id: 'PENDING', label: 'Chờ xác nhận', icon: '⏳' },
  { id: 'CONFIRMED', label: 'Đã xác nhận', icon: '✅' },
  { id: 'PREPARING', label: 'Đang nấu', icon: '👨‍🍳' },
  { id: 'DELIVERING', label: 'Đang giao', icon: '🛵' },
  { id: 'DELIVERED', label: 'Đã giao', icon: '🎉' },
  { id: 'CANCELLED', label: 'Đã huỷ', icon: '❌' },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '⏳' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '✅' },
  PREPARING: { label: 'Đang chuẩn bị', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '👨‍🍳' },
  PREPARED: { label: 'Chờ tài xế', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: '📦' },
  PICKING_UP: { label: 'Lấy hàng', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🏃' },
  DELIVERING: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🛵' },
  DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-700 border-green-200', icon: '🎉' },
  CANCELLED: { label: 'Đã huỷ', color: 'bg-red-100 text-red-700 border-red-200', icon: '❌' },
};

const ITEMS_PER_PAGE = 8;

export default function OrderHistoryPage() {
  const router = useRouter();
  const { user, token, openAuthModal } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user || !token) {
      openAuthModal('login');
      return;
    }
    setLoading(true);
    fetchMyOrdersPaginated(token, {
      status: activeStatus,
      search: searchQuery,
    })
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, token, activeStatus, searchQuery, openAuthModal]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, searchQuery]);

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(
    () => orders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [orders, currentPage]
  );

  const stats = useMemo(() => ({
    total: orders.length,
    active: orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'DELIVERED').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
    totalSpent: orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.total, 0),
  }), [orders]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">📦 Đơn Hàng Của Tôi</h1>
            <p className="mt-1 text-sm text-gray-500 font-medium">Theo dõi và quản lý tất cả đơn hàng</p>
          </div>
          <Link
            href="/menu"
            className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
          >
            🍽️ Đặt món mới
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
            <p className="text-xs font-bold text-gray-500 mt-0.5">Tổng đơn</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-blue-100">
            <p className="text-2xl font-black text-blue-600">{stats.active}</p>
            <p className="text-xs font-bold text-gray-500 mt-0.5">Đang xử lý</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-green-100">
            <p className="text-2xl font-black text-green-600">{stats.completed}</p>
            <p className="text-xs font-bold text-gray-500 mt-0.5">Hoàn thành</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-black text-primary">{formatPrice(stats.totalSpent)}</p>
            <p className="text-xs font-bold text-gray-500 mt-0.5">Đã chi tiêu</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn, tên quán, tên món..."
              className="w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                activeStatus === tab.id
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-20">
            <span className="text-5xl animate-bounce inline-block">📦</span>
            <p className="mt-4 text-sm text-gray-500 font-medium">Đang tải đơn hàng...</p>
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="text-center py-20 rounded-2xl bg-white border border-gray-100">
            <span className="text-6xl">🛒</span>
            <p className="mt-4 text-lg font-bold text-gray-700">
              {searchQuery ? 'Không tìm thấy đơn hàng' : 'Chưa có đơn hàng nào'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Thử từ khoá khác' : 'Hãy bắt đầu khám phá thực đơn ngay!'}
            </p>
            {!searchQuery && (
              <Link
                href="/menu"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-lg"
              >
                🍽️ Khám phá thực đơn
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedOrders.map((order) => {
              const st = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '📋' };
              const isActive = !['DELIVERED', 'CANCELLED'].includes(order.status);

              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className={`group rounded-2xl bg-white p-5 shadow-sm border cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                    isActive ? 'border-primary/20 ring-1 ring-primary/10' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold border ${st.color}`}>
                          {st.icon} {st.label}
                        </span>
                        {isActive && (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                        Đơn #{order.id.slice(0, 8).toUpperCase()}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-gray-300">•</span>
                        <span>{order.items.length} món</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {order.items.slice(0, 3).map((item) => (
                          <span key={item.id} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                            {item.productName}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md font-medium">
                            +{order.items.length - 3} món
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-primary">{formatPrice(order.total)}</p>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors ml-auto mt-2">
                        <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                  currentPage === page
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        )}

        {/* Results count */}
        {!loading && orders.length > 0 && (
          <p className="mt-4 text-center text-xs text-gray-400 font-medium">
            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, orders.length)} / {orders.length} đơn hàng
          </p>
        )}
      </div>
    </main>
  );
}
