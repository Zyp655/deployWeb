'use client';

import { useAuthStore } from '@/store/auth';
import { fetchAdminOrders, updateOrderStatus, Order } from '@/lib/api/client';
import { useEffect, useState } from 'react';

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token]);

  const loadOrders = () => {
    fetchAdminOrders(token!).then(setOrders).finally(() => setLoading(false));
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status, token!);
      // Optimistic update
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (e) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  if (loading) return <div className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h2>
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">{orders.length} Đơn</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-medium text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-4">Mã Đơn</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Tổng tiền</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Ngày đặt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => {
              const userEmail = (order as any).user?.email || 'Khách (Guest)';
              return (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-900 border-l-4 border-transparent hover:border-primary">{order.id.split('-')[0].toUpperCase()}</td>
                  <td className="px-6 py-4 text-gray-700">{userEmail}</td>
                  <td className="px-6 py-4 text-primary font-bold">{new Intl.NumberFormat('vi-VN').format(order.total)} đ</td>
                  <td className="px-6 py-4">
                    <select 
                      className={`border border-gray-200 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 font-semibold ${order.status === 'DELIVERED' ? 'bg-green-50 text-green-700' : 'bg-white text-gray-900'}`}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
