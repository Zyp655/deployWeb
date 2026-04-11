'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchStores, Store } from '@/lib/api/client';
import StarRating from '@/components/StarRating';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          fetchStores(lat, lng)
            .then(setStores)
            .catch(console.error)
            .finally(() => setLoading(false));
        },
        (error) => {
          fetchStores().then(setStores).catch(console.error).finally(() => setLoading(false));
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      fetchStores()
        .then(setStores)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-5xl animate-bounce inline-block">🏪</span>
          <p className="mt-3 text-sm text-gray-500">Đang tìm các quán ngon...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Khám Phá <span className="text-primary">Quán Ngon</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
            Đặt món trực tiếp từ hàng nghìn nhà hàng, quán ăn ngon nhất quanh bạn.
          </p>
        </div>

        {/* Store Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stores.map((store) => (
            <Link key={store.id} href={`/stores/${store.id}`}>
              <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full border border-gray-100">
                {/* Cover Image */}
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  {store.coverImage ? (
                    <img src={store.coverImage} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-100 to-accent-50 text-4xl">🏪</div>
                  )}
                  {/* Status badge */}
                  <span className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur-sm ${store.isOpen ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                    {store.isOpen ? 'Đang mở' : 'Đóng cửa'}
                  </span>
                </div>
                
                {/* Store Info */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                    {store.name}
                  </h3>
                  
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2 line-clamp-1 w-[70%]">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-red-500 flex-shrink-0">
                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                      </svg>
                      {store.address || 'Đang cập nhật địa chỉ'}
                    </div>
                    {store.distance !== undefined && (
                      <div className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md whitespace-nowrap">
                        {store.distance < 1 ? `${Math.round(store.distance * 1000)}m` : `${store.distance.toFixed(1)}km`}
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="mt-3 flex items-center gap-2 mt-auto pt-3 border-t border-gray-50">
                    <StarRating value={store.rating} readOnly size="sm" />
                    <span className="text-xs text-gray-500 font-medium">{store.rating > 0 ? store.rating : 'Chưa có'}</span>
                    <span className="mx-1 text-gray-300">•</span>
                    <span className="text-xs text-gray-500">{store.totalOrders} đơn</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
