'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchStores, Store } from '@/lib/api/client';
import StarRating from '@/components/StarRating';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const resolveImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${url}`;
  };

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
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Premium Header Banner */}
      <div className="bg-gray-900 border-b border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/40 to-accent-900/40 opacity-50 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary-500 blur-[80px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-accent-500 blur-[100px] opacity-20 pointer-events-none"></div>
        
        <div className="container mx-auto max-w-6xl px-6 py-16 md:py-24 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Khám Phá <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Quán Ngon</span>
            </h1>
            <p className="mt-4 text-lg text-gray-300 font-medium leading-relaxed max-w-xl">
              Từ những quán cơm bình dân yêu thích đến các nhà hàng sang trọng. Hàng ngàn lựa chọn ẩm thực tuyệt vời đang chờ bạn.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 -mt-8 relative z-20">
        
        {/* Search & Filter Bar Placeholder */}
        <div className="bg-white rounded-2xl p-4 shadow-lg shadow-gray-200/40 border border-gray-100 flex items-center justify-between mb-12 flex-wrap gap-4">
          <div className="flex-1 min-w-[280px] relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm tên quán ăn, món thèm..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 font-medium text-gray-900" 
            />
          </div>
          <div className="flex gap-2">
             <button className="px-5 py-3 rounded-xl bg-gray-50 font-bold text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200 text-sm">Bộ lọc</button>
             <button className="px-5 py-3 rounded-xl bg-gray-900 font-bold text-white hover:bg-gray-800 transition-colors shadow-md text-sm">Gần tôi nhất</button>
          </div>
        </div>

        {/* Store Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stores.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((store, idx) => (
            <Link key={store.id} href={`/stores/${store.id}`} className="w-full">
              <div 
                className="group relative flex flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-primary-200 hover:-translate-y-1 h-full"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {store.coverImage || store.image ? (
                    <img 
                      src={resolveImageUrl(store.coverImage || store.image) as string} 
                      alt={store.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/E2E8F0/A0AEC0?text=HOANG+FOOD';
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-100 to-accent-50 text-5xl group-hover:scale-110 transition-transform duration-500">🏪</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Status badge */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black shadow-md glass-panel ${store.isOpen ? 'text-green-600' : 'text-gray-600'}`}>
                      <span className={`mr-2 h-2 w-2 rounded-full ${store.isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                      {store.isOpen ? 'Đang mở' : 'Đóng cửa'}
                    </span>
                    {store.distance !== undefined && (
                      <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black shadow-md glass-panel text-gray-900">
                        {store.distance < 1 ? `${Math.round(store.distance * 1000)}m` : `${store.distance.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Store Info */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                    {store.name}
                  </h3>
                  
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 line-clamp-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
                      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                    </svg>
                    {store.address || 'Đang chờ cập nhật'}
                  </div>

                  {/* Rating */}
                  <div className="mt-auto flex items-center gap-3 pt-5 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                      <StarRating value={store.rating} readOnly size="sm" />
                      <span className="text-sm font-bold text-gray-700">{store.rating > 0 ? store.rating : 'Mới'}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-400 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      {store.totalOrders} lượt đặt
                    </span>
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
