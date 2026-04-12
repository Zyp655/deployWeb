'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { fetchDriverMyOrders, DriverOrder } from '@/lib/api/client';
import LiveChatWidget from '@/components/LiveChatWidget';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PICKING_UP: { label: 'Đang lấy hàng', color: 'bg-yellow-100 text-yellow-700' },
  DELIVERING: { label: 'Đang giao', color: 'bg-orange-100 text-orange-700' },
  DELIVERED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã huỷ', color: 'bg-red-100 text-red-700' },
};

export default function DriverMyOrders() {
  const { token, user } = useAuthStore();
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>('all');
  const [activeChatOrder, setActiveChatOrder] = useState<DriverOrder | null>(null);

  useEffect(() => {
    if (!token) return;
    loadOrders();
  }, [token, page]);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchDriverMyOrders(token, page, 20);
      setOrders(data.orders);
      setTotalPages(data.totalPages);
    } catch {}
    setLoading(false);
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
        <span className="text-sm text-gray-500">Trang {page}/{totalPages || 1}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'DELIVERING', label: 'Đang giao' },
          { key: 'DELIVERED', label: 'Hoàn thành' },
          { key: 'CANCELLED', label: 'Đã huỷ' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f.key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <span className="text-5xl block mb-3">📋</span>
          <p className="text-gray-500">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="p-4">Mã đơn</th>
                  <th className="p-4">Thời gian</th>
                  <th className="p-4">Cửa hàng</th>
                  <th className="p-4">Phí ship</th>
                  <th className="p-4">Thu nhập</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {filteredOrders.map((order) => {
                  const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono font-medium text-gray-500">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="p-4 text-gray-500">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4 font-medium max-w-[200px] truncate">
                        {order.store?.name}
                      </td>
                      <td className="p-4 font-semibold text-gray-900">
                        {fmt(order.shippingFee)}đ
                      </td>
                      <td className="p-4">
                        {order.earning ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-green-600">{fmt(order.earning.totalFee)}đ</p>
                            {order.earning.tip > 0 && (
                              <p className="text-xs text-orange-500">+{fmt(order.earning.tip)}đ tip</p>
                            )}
                            {order.earning.bonus > 0 && (
                              <p className="text-xs text-purple-500">+{fmt(order.earning.bonus)}đ bonus</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        {order.status === 'DELIVERING' && order.user && (
                          <button
                            onClick={() => setActiveChatOrder(order)}
                            className="text-orange-500 hover:text-orange-600 text-xs font-bold"
                          >
                            💬 Chat
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            ← Trước
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${
                page === p
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Sau →
          </button>
        </div>
      )}

      {activeChatOrder && activeChatOrder.user && user && (
        <LiveChatWidget
          orderId={activeChatOrder.id}
          receiverId={activeChatOrder.user.id}
          receiverName={activeChatOrder.user.name}
          receiverRole="CUSTOMER"
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
