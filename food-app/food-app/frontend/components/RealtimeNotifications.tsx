'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RealtimeNotifications() {
  const { user, token } = useAuthStore();
  const [notification, setNotification] = useState<{
    orderId: string;
    status: string;
    note?: string;
  } | null>(null);

  useEffect(() => {
    if (!user || !token) return;

    const socket: Socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to real-time notifications');
    });

    socket.on('order-status-updated', (data) => {
      console.log('🔔 MỚI: Cập nhật đơn hàng', data);
      setNotification(data);
      // Auto-hide after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, token]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-slide-up">
      <div className="flex max-w-sm items-start gap-3 rounded-2xl bg-white p-4 shadow-2xl border border-primary/20 cursor-pointer"
           onClick={() => window.location.href = `/orders/${notification.orderId}`}>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          <span className="text-xl">🛵</span>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900">
            Đơn hàng #{notification.orderId.slice(0, 8).toUpperCase()}
          </h4>
          <p className="mt-1 text-sm text-gray-600">
            Trạng thái mới: <strong className="text-primary">{formatStatus(notification.status)}</strong>
          </p>
          {notification.note && (
            <p className="mt-1 text-xs text-gray-500 italic">
              "{notification.note}"
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setNotification(null);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Chờ xử lý ⏳',
    CONFIRMED: 'Đã xác nhận ✅',
    PREPARING: 'Đang chuẩn bị 🍳',
    DELIVERING: 'Đang giao hàng 🛵',
    DELIVERED: 'Đã giao thành công 🎉',
    CANCELLED: 'Đã hủy ❌',
  };
  return map[status] || status;
}
