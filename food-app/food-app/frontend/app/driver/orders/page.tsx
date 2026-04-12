'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import {
  fetchAvailableOrders,
  acceptOrder,
  updateDriverLocation,
  DriverOrder,
} from '@/lib/api/client';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function DriverAvailableOrders() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || user?.role !== 'DRIVER') return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateDriverLocation(pos.coords.latitude, pos.coords.longitude, token).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true },
      );
    }

    loadOrders();

    const socket = io(WS_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('order-prepared', () => loadOrders());
    socket.on('order-taken', ({ orderId }: { orderId: string }) => {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    });

    return () => { socket.disconnect(); };
  }, [token, user]);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAvailableOrders(token);
      setOrders(data);
    } catch {}
    setLoading(false);
  };

  const handleAccept = async (orderId: string) => {
    if (!token || accepting) return;
    setAccepting(orderId);
    try {
      await acceptOrder(orderId, token);
      router.push(`/driver/delivery/${orderId}`);
    } catch (e: any) {
      alert(e.message || 'Không thể nhận đơn');
    }
    setAccepting(null);
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đơn mới quanh bạn</h1>
          <p className="text-gray-500 text-sm">{orders.length} đơn đang chờ tài xế</p>
        </div>
        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
        >
          🔄 Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <span className="text-6xl block mb-4">😴</span>
          <h3 className="text-xl font-bold text-gray-700">Chưa có đơn hàng nào</h3>
          <p className="text-gray-500 mt-2">Hãy chờ chút, đơn mới sẽ tự động hiện lên khi có!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-lg">MỚI</span>
                      <span className="text-gray-400 text-xs font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                      {order.distanceToStore !== null && order.distanceToStore !== undefined && (
                        <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-md">
                          📍 {order.distanceToStore} km
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">🏪 {order.store?.name}</h3>
                    <p className="text-gray-500 text-sm mt-1 flex items-start gap-1">
                      <span className="shrink-0">📍</span>
                      <span className="line-clamp-2">{order.store?.address} → {order.deliveryAddress}</span>
                    </p>
                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.items.slice(0, 3).map((item) => (
                          <span key={item.id} className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-md">
                            {item.quantity}x {item.product.name}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-gray-400 text-xs py-1">+{order.items.length - 3} món</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-orange-500">{fmt(order.shippingFee)}đ</p>
                    <p className="text-xs text-gray-400">phí ship</p>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{fmt(order.total)}đ</p>
                    <p className="text-xs text-gray-400">tổng đơn</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>💳 {order.paymentMethod}</span>
                    <span>·</span>
                    <span>{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button
                    onClick={() => handleAccept(order.id)}
                    disabled={accepting === order.id}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-2.5 px-6 rounded-xl hover:shadow-lg transition-all active:scale-[0.97] disabled:opacity-50"
                  >
                    {accepting === order.id ? 'Đang nhận...' : 'Nhận đơn'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
