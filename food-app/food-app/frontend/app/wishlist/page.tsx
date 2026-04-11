'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { fetchWishlist, WishlistItem, removeFromWishlist } from '@/lib/api/client';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default function WishlistPage() {
  const { user, token, openAuthModal } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchWishlist(token)
      .then(setItems)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRemove = async (productId: string) => {
    if (!token) return;
    try {
      await removeFromWishlist(productId, token);
      setItems((prev) => prev.filter((i) => i.id !== productId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || !token) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center bg-gray-50 px-4">
        <span className="text-5xl mb-4">❤️</span>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập để xem danh sách yêu thích</h1>
        <button
          onClick={() => openAuthModal('login')}
          className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-colors shadow-sm cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50">
        <span className="text-5xl animate-bounce">🍜</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">❤️ Món ăn yêu thích</h1>
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-600">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-sm border border-gray-100">
            <span className="text-6xl mb-4 grayscale opacity-50">🍽️</span>
            <h2 className="text-xl font-bold text-gray-900">Danh sách trống</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              Bạn chưa lưu món ăn nào vào danh sách yêu thích. Hãy khám phá thực đơn của chúng tôi!
            </p>
            <Link
              href="/menu"
              className="mt-6 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Xem thực đơn
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.wishlistId} className="relative group">
                <ProductCard product={item} />
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute -top-3 -right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg opacity-0 transition-all hover:bg-red-600 hover:scale-110 group-hover:opacity-100"
                  title="Xóa khỏi danh sách"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
