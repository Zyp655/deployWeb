'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';
import NotificationPanel from '@/components/NotificationPanel';

export default function Navbar() {
  const totalItems = useCartStore((state) => state.totalItems);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const toggleNotifications = useNotificationStore((s) => s.togglePanel);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <div className="sticky top-4 z-50 px-4">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 rounded-full glass-nav transition-all duration-300 shadow-lg shadow-gray-200/50">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500 hover:scale-105 transition-transform"
        >
          <span className="text-2xl">🍜</span>
          <span className="hidden sm:inline tracking-tight">HOANG FOOD</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          {(!user || (user.role !== 'RESTAURANT' && user.role !== 'ADMIN')) && (
            <Link
              href="/stores"
              className="text-sm font-bold text-gray-600 transition-colors hover:text-primary-600"
            >
              Quán ăn
            </Link>
          )}

          {user && (
            <>
              {user.role !== 'RESTAURANT' && user.role !== 'ADMIN' && (
                <Link
                  href="/wishlist"
                  className="text-sm font-bold text-gray-600 transition-colors hover:text-primary-600 hidden sm:block"
                >
                  Yêu thích
                </Link>
              )}
              <Link
                href="/profile"
                className="text-sm font-bold text-gray-600 transition-colors hover:text-primary-600 hidden sm:block"
              >
                Tài khoản
              </Link>

              {user.role === 'CUSTOMER' && (
                <Link
                  href="/partner-register"
                  className="text-sm font-bold text-orange-500 transition-colors hover:text-orange-600 hidden sm:block"
                >
                  Trở thành Đối tác 🤝
                </Link>
              )}

              {user.role === 'RESTAURANT' && (
                <Link
                  href="/seller"
                  className="text-sm font-bold text-accent-500 transition-colors hover:text-accent-600 bg-accent-50 px-3 py-1.5 rounded-full"
                >
                  🏪 Seller
                </Link>
              )}

              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="text-sm font-bold text-red-500 transition-colors hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-full"
                >
                  ⚙️ Admin
                </Link>
              )}

              {user.role === 'DRIVER' && (
                <Link
                  href="/driver"
                  className="text-sm font-bold text-emerald-600 transition-colors hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full"
                >
                  🛵 Tài xế
                </Link>
              )}
            </>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="relative rounded-full bg-gray-50 p-2.5 transition-colors hover:bg-primary-50 shadow-sm hover:shadow"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-700">
                    <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 004.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
                  </svg>
                  {unreadCount() > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm border-2 border-white">
                      {unreadCount() > 9 ? '9+' : unreadCount()}
                    </span>
                  )}
                </button>
                <NotificationPanel />
              </div>

              <Link href="/profile" className="flex items-center gap-2 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-md group-hover:scale-110 transition-transform">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </Link>
              <button
                onClick={logout}
                className="rounded-full px-4 py-2 text-xs font-bold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
            >
              Đăng nhập
            </button>
          )}

          <button
            onClick={toggleCart}
            className="relative rounded-full bg-gray-50 p-2.5 transition-colors hover:bg-primary-50 shadow-sm hover:shadow"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-gray-700"
            >
              <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
            </svg>
            {totalItems() > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm border-2 border-white">
                {totalItems()}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
