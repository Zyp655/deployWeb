'use client';

import { useEffect, useRef } from 'react';
import { useNotificationStore, AppNotification } from '@/store/notifications';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function NotificationItem({ n, onClick }: { n: AppNotification; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${!n.isRead ? 'bg-primary-50/40' : ''}`}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg">
        {n.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.isRead && (
        <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
      )}
    </div>
  );
}

export default function NotificationPanel() {
  const { notifications, isOpen, closePanel, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotificationStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, closePanel]);

  if (!isOpen) return null;

  const count = unreadCount();

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-3 w-[380px] max-h-[480px] rounded-2xl bg-white shadow-2xl border border-gray-200/80 overflow-hidden z-[200] flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
          🔔 Thông báo
          {count > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          {count > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold text-primary hover:text-primary-600 transition-colors"
            >
              Đọc hết
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              Xóa tất cả
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <span className="text-4xl opacity-40">🔕</span>
            <p className="mt-3 text-sm text-gray-400 font-medium">Chưa có thông báo nào</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              n={n}
              onClick={() => {
                markAsRead(n.id);
                if (n.href) window.location.href = n.href;
                closePanel();
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
