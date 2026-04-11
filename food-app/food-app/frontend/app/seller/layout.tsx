'use client';

import SellerProtectedRoute from '@/components/SellerProtectedRoute';
import Link from 'next/link';
import { ReactNode, useRef, useState } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { useAuthStore } from '@/store/auth';
import { uploadImage, updateProfile } from '@/lib/api/client';

export default function SellerLayout({ children }: { children: ReactNode }) {
  const { user, token, setAuth } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !user) return;
    try {
      setUploading(true);
      const { url } = await uploadImage(file, token);
      const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
      const updated = await updateProfile({ avatar: fullUrl }, token);
      setAuth({ ...user, avatar: updated.avatar }, token);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = user?.avatar;
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'S';

  return (
    <SellerProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <aside className="w-64 bg-[#1A1A2E] text-white flex flex-col shadow-xl z-20">
          <div className="p-6 border-b border-white/10">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              🍜 HOANG FOOD
            </h1>
          </div>

          {/* Avatar Section */}
          <div className="px-6 py-5 border-b border-white/10 flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg group-hover:border-primary/50 transition-all"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-black text-white border-4 border-white/20 shadow-lg group-hover:border-primary/50 transition-all">
                  {initial}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm text-white truncate max-w-40">{user?.name || 'Seller'}</p>
              <p className="text-xs text-gray-400 truncate max-w-40">{user?.email}</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            <Link href="/seller" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
              📊 Tổng quan
            </Link>
            <Link href="/seller/store" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
              🏪 Cửa hàng
            </Link>
            <Link href="/seller/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
              🧾 Đơn hàng
            </Link>
            <Link href="/seller/products" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
              🍔 Sản phẩm
            </Link>
            <Link href="/seller/promotions" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
              🏷️ Khuyến mãi
            </Link>
            <Link href="/seller/reviews" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
              ⭐ Đánh giá
            </Link>
          </nav>
          <div className="p-4 border-t border-white/10">
            <LogoutButton className="block w-full px-4 py-3 text-center rounded-xl bg-white/5 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-colors" />
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </SellerProtectedRoute>
  );
}
