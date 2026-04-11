'use client';

import { useAuthStore } from '@/store/auth';
import { fetchSellerOrders, updateSellerOrderStatus, SellerOrder } from '@/lib/api/client';
import { useEffect, useState } from 'react';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  PREPARING: { label: 'Đang chuẩn bị', color: 'bg-indigo-100 text-indigo-700' },
  PREPARED: { label: 'Chuẩn bị xong (Chờ shipper)', color: 'bg-orange-100 text-orange-700' },
  DELIVERING: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'PREPARED',
};

export default function SellerOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (token) {
      fetchSellerOrders(token)
        .then(setOrders)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!token) return;
    try {
      await updateSellerOrderStatus(orderId, newStatus, token);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    } catch (err) { console.error(err); }
  };

  const handleReject = async (orderId: string) => {
    if (!token) return;
    const reason = window.prompt("Nhập lý do từ chối đơn hàng (ví dụ: Hết món, Đóng cửa...):");
    if (!reason) return;
    try {
      // Need to import rejectSellerOrder from client API
      const { rejectSellerOrder } = await import('@/lib/api/client');
      await rejectSellerOrder(orderId, reason, token);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o)),
      );
    } catch (err) { console.error(err); alert('Có lỗi xảy ra'); }
  };

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-extrabold text-gray-900">🧾 Đơn hàng</h2>
        <p className="text-gray-500 mt-1">Quản lý và xử lý đơn hàng từ khách hàng</p>
      </header>

      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'PREPARED', 'DELIVERING', 'DELIVERED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
              filter === st ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/50'
            }`}
          >
            {st === 'ALL' ? 'Tất cả' : STATUS_MAP[st]?.label || st}
            {st !== 'ALL' && ` (${orders.filter((o) => o.status === st).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl"><span className="text-5xl">📭</span><p className="mt-3 text-gray-500">Không có đơn hàng nào</p></div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const st = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
            const nextSt = NEXT_STATUS[order.status];
            return (
              <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-gray-900">#{order.id.slice(0, 8)}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      👤 {order.user.name} • {order.user.email}
                      {order.user.phone && ` • 📞 ${order.user.phone}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span className="text-lg font-extrabold text-primary">{formatPrice(order.total)}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {order.items.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                      {item.productName || 'Món ăn'} × {item.quantity}
                    </span>
                  ))}
                </div>

                {(nextSt || order.status === 'PENDING') && (
                  <div className="mt-4 flex gap-2">
                    {nextSt && (
                      <button
                        onClick={() => handleStatusChange(order.id, nextSt)}
                        className="rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-bold text-white transition-all hover:shadow-md hover:brightness-110 active:scale-95"
                      >
                        ✅ {STATUS_MAP[nextSt]?.label || nextSt}
                      </button>
                    )}
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleReject(order.id)}
                        className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 border border-red-200 transition-all hover:bg-red-100 active:scale-95"
                      >
                        ❌ Từ chối
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
