import SellerProtectedRoute from '@/components/SellerProtectedRoute';
import Link from 'next/link';
import { ReactNode } from 'react';

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <SellerProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <aside className="w-64 bg-[#1A1A2E] text-white flex flex-col shadow-xl z-20">
          <div className="p-6 border-b border-white/10">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              🍜 FoodSeller
            </h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            <Link href="/seller" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
              📊 Tổng quan
            </Link>
            <Link href="/seller/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
              🧾 Đơn hàng
            </Link>
            <Link href="/seller/products" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
              🍔 Sản phẩm
            </Link>
          </nav>
          <div className="p-4 border-t border-white/10">
            <Link href="/menu" className="block px-4 py-3 text-center rounded-xl bg-white/5 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              ← Quay lại Cửa hàng
            </Link>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </SellerProtectedRoute>
  );
}
