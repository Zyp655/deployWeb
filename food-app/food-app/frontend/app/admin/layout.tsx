'use client';

import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import Link from 'next/link';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { useAuthStore } from '@/store/auth';

const NAV_ITEMS = [
  { href: '/admin', label: 'Tổng quan', icon: '📊' },
  { href: '/admin/orders', label: 'Đơn hàng', icon: '🧾' },
  { href: '/admin/products', label: 'Sản phẩm', icon: '🍔' },
  { href: '/admin/users', label: 'Người dùng', icon: '👥' },
  { href: '/admin/reviews', label: 'Đánh giá', icon: '⭐' },
  { href: '/admin/coupons', label: 'Khuyến mãi', icon: '🏷️' },
  { href: '/admin/partner-requests', label: 'Duyệt Đối tác', icon: '📝' },
  { href: '/admin/withdrawals', label: 'Thanh toán & Rút tiền', icon: '💸' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <AdminProtectedRoute>
      <div className="flex h-screen">
        <aside className="w-64 ds-sidebar flex flex-col shadow-xl z-20">
          <div className="p-6 border-b border-white/10">
            <h1 className="ds-sidebar-brand">🍜 HOANG FOOD</h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mt-1 font-semibold">Admin Panel</p>
          </div>

          <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-black text-white shadow-lg">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`ds-nav-item ${isActive ? 'ds-nav-active' : ''}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <LogoutButton className="block w-full px-4 py-2.5 text-center rounded-xl bg-white/5 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-colors" />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto ds-page-bg">
          <div className="max-w-7xl mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminProtectedRoute>
  );
}
