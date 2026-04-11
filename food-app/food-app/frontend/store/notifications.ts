import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppNotification {
  id: string;
  type: 'order' | 'chat' | 'promo' | 'system';
  title: string;
  message: string;
  icon: string;
  orderId?: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  isOpen: boolean;
  addNotification: (n: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  togglePanel: () => void;
  closePanel: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isOpen: false,

      addNotification: (n) => {
        const notification: AppNotification = {
          ...n,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
        }));
      },

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      clearAll: () => set({ notifications: [] }),

      togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

      closePanel: () => set({ isOpen: false }),

      unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
    }),
    {
      name: 'food-app-notifications',
      partialize: (state) => ({ notifications: state.notifications }),
    },
  ),
);
