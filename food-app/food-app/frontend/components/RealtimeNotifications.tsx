'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_MAP: Record<string, { label: string; icon: string }> = {
  PENDING: { label: 'Chờ xử lý', icon: '⏳' },
  CONFIRMED: { label: 'Đã xác nhận', icon: '✅' },
  PREPARING: { label: 'Đang chuẩn bị', icon: '🍳' },
  PREPARED: { label: 'Sẵn sàng giao', icon: '📦' },
  DELIVERING: { label: 'Đang giao hàng', icon: '🛵' },
  DELIVERED: { label: 'Đã giao thành công', icon: '🎉' },
  CANCELLED: { label: 'Đã hủy', icon: '❌' },
};

export default function RealtimeNotifications() {
  const { user, token } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [toast, setToast] = useState<{
    id: string;
    title: string;
    message: string;
    icon: string;
    orderId?: string;
  } | null>(null);

  useEffect(() => {
    if (!user || !token) return;

    const socket: Socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('order-status-updated', (data) => {
      const info = STATUS_MAP[data.status] || { label: data.status, icon: '📋' };
      const orderCode = data.orderId?.slice(0, 8).toUpperCase() || '';

      addNotification({
        type: 'order',
        title: `Đơn #${orderCode}`,
        message: `${info.label}${data.note ? ` — ${data.note}` : ''}`,
        icon: info.icon,
        orderId: data.orderId,
        href: `/orders/${data.orderId}`,
      });

      setToast({
        id: `${Date.now()}`,
        title: `Đơn #${orderCode}`,
        message: info.label,
        icon: info.icon,
        orderId: data.orderId,
      });
    });

    socket.on('chat-message-received', (data) => {
      if (data.senderId === user.id) return;
      const senderName = data.sender?.name || 'Ai đó';
      addNotification({
        type: 'chat',
        title: `Tin nhắn từ ${senderName}`,
        message: data.content?.slice(0, 80) || 'Tin nhắn mới',
        icon: '💬',
        orderId: data.orderId,
        href: `/orders/${data.orderId}`,
      });

      setToast({
        id: `${Date.now()}`,
        title: `💬 ${senderName}`,
        message: data.content?.slice(0, 60) || 'Tin nhắn mới',
        icon: '💬',
        orderId: data.orderId,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, token, addNotification]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] animate-slide-up cursor-pointer"
      onClick={() => {
        if (toast.orderId) window.location.href = `/orders/${toast.orderId}`;
        setToast(null);
      }}
    >
      <div className="flex max-w-sm items-start gap-3 rounded-2xl bg-white p-4 shadow-2xl border border-gray-200/80 backdrop-blur-sm">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-xl">
          {toast.icon || '🔔'}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 truncate">{toast.title}</h4>
          <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">{toast.message}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setToast(null);
          }}
          className="text-gray-400 hover:text-gray-600 mt-0.5 shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
