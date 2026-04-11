'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchStoreById, StoreDetail } from '@/lib/api/client';
import ProductCard from '@/components/ProductCard';
import StarRating from '@/components/StarRating';

export default function StoreDetailPage() {
  const params = useParams();
  const storeId = params.id as string;
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!storeId) return;
    fetchStoreById(storeId)
      .then(setStore)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-5xl animate-bounce inline-block">🏪</span>
          <p className="mt-3 text-sm text-gray-500">Đang tải thông tin quán...</p>
        </div>
      </main>
    );
  }

  if (error || !store) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <span className="text-5xl">😵</span>
        <p className="mt-4 text-lg font-semibold text-gray-700">
          {error || 'Không tìm thấy thông tin quán'}
        </p>
        <Link
          href="/stores"
          className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-600"
        >
          Xem các quán khác
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      {/* Store Header Banner */}
      <section className="relative h-64 md:h-80 w-full overflow-hidden bg-gray-900">
        <div className="absolute inset-0 opacity-60">
           {store.coverImage ? (
              <img src={store.coverImage} alt={store.name} className="w-full h-full object-cover" />
           ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-900 to-accent-900" />
           )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 w-full p-6 md:p-10">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end gap-6 relative z-10">
              {/* Store Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white bg-white shadow-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                {store.image ? (
                   <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                   <span className="text-5xl">🏪</span>
                )}
              </div>
              
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${store.isOpen ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {store.isOpen ? 'Đang mở' : 'Đóng cửa'}
                  </span>
                  <span className="text-white/80 text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                     ⏱ {store.openTime} - {store.closeTime}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                  {store.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-200">
                  <div className="flex items-center gap-1.5">
                    <StarRating value={store.rating} readOnly size="sm" />
                    <span className="font-bold text-white">{store.rating}</span>
                    <span className="text-white/60">({store.totalOrders}+ đơn)</span>
                  </div>
                  <span className="w-1 h-1 rounded-full bg-gray-400" />
                  <span className="flex items-center gap-1">
                    📍 {store.address || 'Đang cập nhật'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Store Menu */}
      <section className="container mx-auto max-w-6xl px-4 py-10 mt-4">
        {store.description && (
          <div className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-2">Giới thiệu quán</h3>
             <p className="text-gray-600 leading-relaxed text-sm">{store.description}</p>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
             <span className="bg-primary/10 text-primary w-10 h-10 rounded-xl flex items-center justify-center">🍽️</span> 
             Thực đơn
           </h2>
           <span className="text-sm font-bold text-gray-500 bg-gray-200 px-3 py-1 rounded-full">{store.products.length} món</span>
        </div>

        {store.products.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm border border-gray-100">
            <span className="text-6xl grayscale opacity-50 block mb-4">🛒</span>
            <h3 className="text-xl font-bold text-gray-900">Quán chưa có món nào</h3>
            <p className="mt-2 text-gray-500 text-sm">Hãy quay lại sau khi quán cập nhật thực đơn nhé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {store.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
