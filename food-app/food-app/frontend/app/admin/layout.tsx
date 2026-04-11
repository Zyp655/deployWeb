import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import Link from 'next/link';
import { ReactNode } from 'react';
import LogoutButton from '@/components/LogoutButton';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl z-20">
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              HOANG FOOD
            </h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link href="/admin" className="block px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              📊 Tổng quan
            </Link>
            <Link href="/admin/orders" className="block px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              🧾 Quản lý Đơn hàng
            </Link>
            <Link href="/admin/products" className="block px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              🍔 Quản lý Món ăn
            </Link>
            <Link href="/admin/users" className="block px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              👥 Quản lý Người dùng
            </Link>
            <Link href="/admin/reviews" className="block px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              ⭐ Quản lý Đánh giá
            </Link>
            <Link href="/admin/coupons" className="block px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              🏷️ Mã giảm giá
            </Link>
          </nav>
          <div className="p-6 border-t border-gray-800">
            <LogoutButton className="block w-full px-4 py-3 text-center rounded-xl bg-gray-800 text-sm font-semibold text-gray-300 hover:text-white transition-colors" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AdminProtectedRoute>
  );
}
