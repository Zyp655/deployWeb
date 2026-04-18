'use client';

import { useAuthStore } from '@/store/auth';
import { fetchSellerOrders, updateSellerOrderStatus, SellerOrder } from '@/lib/api/client';
import { useEffect, useState } from 'react';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Chờ xác nhận', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  CONFIRMED: { label: 'Đã xác nhận', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  PREPARING: { label: 'Đang chuẩn bị', bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
  PREPARED: { label: 'Chờ shipper', bg: 'bg-amber-600/10', text: 'text-amber-700' },
  DELIVERING: { label: 'Đang giao', bg: 'bg-violet-500/10', text: 'text-violet-600' },
  DELIVERED: { label: 'Đã giao', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  CANCELLED: { label: 'Đã hủy', bg: 'bg-primary/10', text: 'text-primary' },
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
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) { console.error(err); }
  };

  const handleReject = async (orderId: string) => {
    if (!token) return;
    const reason = window.prompt("Nhập lý do từ chối đơn hàng (ví dụ: Hết món, Đóng cửa...):");
    if (!reason) return;
    try {
      const { rejectSellerOrder } = await import('@/lib/api/client');
      await rejectSellerOrder(orderId, reason, token);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED', refundStatus: o.paymentMethod !== 'COD' ? 'PENDING' : 'NONE' } : o)));
    } catch (err) { console.error(err); alert('Có lỗi xảy ra'); }
  };



  const pendingRefundCount = orders.filter((o) => (o as any).refundStatus === 'PENDING').length;
  const filtered = filter === 'ALL'
    ? orders
    : filter === 'REFUND'
      ? orders.filter((o) => (o as any).refundStatus === 'PENDING')
      : orders.filter((o) => o.status === filter);

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="ds-heading text-3xl font-extrabold text-[#1a1a2e]">🧾 Đơn hàng</h2>
        <p className="text-[#5b403d] mt-1 text-sm">Quản lý và xử lý đơn hàng từ khách hàng</p>
      </header>

      <div className="flex gap-1.5 bg-[#efecff] p-1 rounded-xl flex-wrap w-fit">
        {['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'PREPARED', 'DELIVERING', 'DELIVERED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === st ? 'bg-white text-[#1a1a2e] shadow-sm' : 'text-[#5b403d] hover:text-[#1a1a2e]'
            }`}
          >
            {st === 'ALL' ? 'Tất cả' : STATUS_MAP[st]?.label || st}
            {st !== 'ALL' && ` (${orders.filter((o) => o.status === st).length})`}
          </button>
        ))}
        {pendingRefundCount > 0 && (
          <button
            onClick={() => setFilter('REFUND')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'REFUND' ? 'bg-white text-amber-600 shadow-sm' : 'text-amber-600 hover:text-amber-700'
            }`}
          >
            💰 Chờ hoàn tiền ({pendingRefundCount})
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 ds-card">
          <span className="text-5xl">📭</span>
          <p className="mt-3 text-[#906f6c]">Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const st = STATUS_MAP[order.status] || { label: order.status, bg: 'bg-gray-100', text: 'text-gray-700' };
            const nextSt = NEXT_STATUS[order.status];
            const refundStatus = (order as any).refundStatus as string | undefined;
            return (
              <div key={order.id} className={`ds-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_50px_rgba(26,26,46,0.1)] ${refundStatus === 'PENDING' ? 'ring-2 ring-amber-300' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-bold text-[#1a1a2e]">#{order.id.slice(0, 8)}</p>
                      <span className={`ds-badge ${st.bg} ${st.text}`}>{st.label}</span>
                      {order.paymentMethod && order.paymentMethod !== 'COD' && (
                        <span className="ds-badge bg-blue-500/10 text-blue-600">
                          {order.paymentMethod === 'SEPAY' && '🏦 VietQR'}
                          {order.paymentMethod === 'MOMO' && '🟣 MoMo'}
                          {order.paymentMethod === 'VNPAY' && '🔴 VNPay'}
                        </span>
                      )}
                      {refundStatus === 'PENDING' && (
                        <span className="ds-badge bg-amber-500/10 text-amber-600 animate-pulse">💰 Chờ hoàn tiền</span>
                      )}
                      {refundStatus === 'COMPLETED' && (
                        <span className="ds-badge bg-emerald-500/10 text-emerald-600">✅ Đã hoàn tiền</span>
                      )}
                    </div>
                    <p className="text-xs text-[#906f6c] mt-1">
                      👤 {order.user.name} • {order.user.email}
                      {order.user.phone && ` • 📞 ${order.user.phone}`}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <p className="text-xs text-[#e4beb9]">
                        Tạo lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
                      {order.isScheduled && order.scheduledAt && (
                        <p className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full flex items-center">
                          📅 Giao hẹn: {new Date(order.scheduledAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-lg font-extrabold text-primary">{formatPrice(order.total)}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="inline-flex flex-col rounded-lg bg-[#f5f2ff] px-3 py-1.5">
                      <span className="text-xs font-medium text-[#1a1a2e]">
                        {item.productName || 'Món ăn'} × {item.quantity}
                      </span>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <span className="text-[10px] text-[#906f6c] mt-0.5">
                          {item.selectedOptions.map(o => o.choice).join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2 items-center flex-wrap">
                  {nextSt && (
                    <button
                      onClick={() => handleStatusChange(order.id, nextSt)}
                      className="ds-gradient-cta px-4 py-2 text-xs"
                    >
                      ✅ {STATUS_MAP[nextSt]?.label || nextSt}
                    </button>
                  )}
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleReject(order.id)}
                      className="rounded-xl bg-primary/5 px-4 py-2 text-xs font-bold text-primary border border-primary/10 transition-all hover:bg-primary/10 active:scale-95"
                    >
                      ❌ Từ chối
                    </button>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
