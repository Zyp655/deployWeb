'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchStores, fetchRecommendedProducts, Store, RecommendedProduct } from '@/lib/api/client';
import StarRating from '@/components/StarRating';
import { useAuthStore } from '@/store/auth';

const CATEGORIES = [
  { emoji: '🍜', name: 'Món nước' },
  { emoji: '🥖', name: 'Món khô' },
  { emoji: '🍚', name: 'Cơm' },
  { emoji: '🥗', name: 'Khai vị' },
  { emoji: '🥩', name: 'Món mặn' },
  { emoji: '🍮', name: 'Tráng miệng' },
  { emoji: '🍵', name: 'Đồ uống' },
];

function getCategoryEmoji(category: string): string {
  return CATEGORIES.find((c) => c.name === category)?.emoji || '🍽️';
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function HomePage() {
  const { token } = useAuthStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    // Tự động tìm vị trí
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          fetchStores(lat, lng).then(setStores).catch(console.error).finally(() => setLocating(false));
          fetchRecommendedProducts(token || undefined).then(setRecommended).catch(console.error);
        },
        (error) => {
          console.warn("User denied or error GPS:", error);
          // Fallback to normal fetch
          fetchStores().then(setStores).catch(console.error).finally(() => setLocating(false));
          fetchRecommendedProducts(token || undefined).then(setRecommended).catch(console.error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      fetchStores().then(setStores).catch(console.error);
      fetchRecommendedProducts(token || undefined).then(setRecommended).catch(console.error);
    }
  }, [token]);

  const popularStores = stores.slice(0, 4);

  return (
    <main className="min-h-screen">
      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-600 to-accent">
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <span className="absolute text-7xl opacity-10 animate-float-slow" style={{ top: '10%', left: '5%' }}>🍜</span>
          <span className="absolute text-6xl opacity-10 animate-float-mid" style={{ top: '20%', right: '8%' }}>🍔</span>
          <span className="absolute text-8xl opacity-10 animate-float-fast" style={{ bottom: '15%', left: '15%' }}>🍣</span>
          <span className="absolute text-5xl opacity-10 animate-float-slow" style={{ bottom: '10%', right: '20%' }}>🥗</span>
          <span className="absolute text-7xl opacity-10 animate-float-mid" style={{ top: '50%', left: '50%' }}>🥘</span>
          <span className="absolute text-6xl opacity-10 animate-float-fast" style={{ top: '60%', right: '35%' }}>🍲</span>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight animate-fade-up">
            Trải nghiệm ẩm thực,
            <br />
            <span className="text-highlight-200">từ quán ưa thích</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl mx-auto animate-fade-up-delay">
            Nền tảng đặt đồ ăn trực tuyến tích hợp AI thông minh — Dẫn đường bạn đến hàng ngàn quán ngon
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up-delay-2">
            <Link
              href="/stores"
              className="group flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-primary shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              Khám phá quán ngon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 transition-transform group-hover:translate-x-1">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto animate-fade-up-delay-2">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white">{stores.length > 0 ? `${stores.length}+` : 'Nhiều'}</p>
              <p className="text-sm text-white/60">Quán ăn</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white">15p</p>
              <p className="text-sm text-white/60">Giao hàng</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white">4.8⭐</p>
              <p className="text-sm text-white/60">Đánh giá chung</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* ═══════ CATEGORIES ═══════ */}
      <section className="mx-auto max-w-6xl px-4 -mt-8 relative z-20">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/menu?category=${encodeURIComponent(cat.name)}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 rounded-2xl bg-white/80 backdrop-blur-lg px-6 py-5 shadow-lg border border-white/50 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1"
            >
              <span className="text-4xl">{cat.emoji}</span>
              <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ TOP STORES ═══════ */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">🏪 Quán ngon quanh bạn</h2>
            <p className="mt-1 text-gray-500">Những tiệm ăn được yêu thích nhất</p>
          </div>
          <Link href="/stores" className="text-sm font-bold text-primary hover:text-primary-600 transition-colors">
            Xem tất cả quán →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularStores.map((store, idx) => (
            <Link key={store.id} href={`/stores/${store.id}`}>
              <div
                className="group rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {store.coverImage ? (
                    <img src={store.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={store.name} />
                  ) : (
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-500">🏪</span>
                  )}
                  <span className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur-sm ${store.isOpen ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                    {store.isOpen ? 'Đang mở' : 'Đóng cửa'}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{store.name}</h3>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 line-clamp-1 w-full max-w-[70%]">
                      📍 {store.address || 'Đang cập nhật'}
                    </div>
                    {store.distance !== undefined && (
                      <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md whitespace-nowrap">
                        {store.distance < 1 ? `${Math.round(store.distance * 1000)}m` : `${store.distance.toFixed(1)}km`}
                      </div>
                    )}
                  </div>
                  <div className="mt-auto pt-4 flex items-center gap-2">
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
      </section>

      {/* ═══════ AI RECOMMENDATION (Products) ═══════ */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-white">🤖 Món ngon AI Gợi Ý</h2>
            <p className="mt-2 text-gray-400">Dựa trên khẩu vị và xu hướng đặt hàng</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {recommended.slice(0, 4).map((product, idx) => {
              return (
                <Link
                  key={product.id}
                  href={`/menu/${product.id}`}
                  className="group relative rounded-2xl bg-gray-800/50 backdrop-blur border border-gray-700/50 p-6 transition-all duration-300 hover:bg-gray-800 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 flex flex-col"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gray-700/50 flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">{getCategoryEmoji(product.category)}</span>
                  </div>
                  <h3 className="text-md font-bold text-white group-hover:text-primary-300 transition-colors text-center line-clamp-1">{product.name}</h3>
                  <p className="mt-1 flex-1 text-xs text-gray-400 line-clamp-2 text-center">{product.recommendReason || 'Món ngon mỗi ngày'}</p>
                  <p className="mt-3 text-lg font-extrabold text-primary-400 text-center">{formatPrice(product.price)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ PROMO ═══════ */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-accent to-highlight p-10 md:p-14 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-30" />
          <div className="relative z-10">
            <span className="text-5xl">🎉</span>
            <h3 className="mt-4 text-3xl md:text-4xl font-extrabold text-white">
              Săn Deal Các Quán
            </h3>
            <p className="mt-2 text-lg text-white/80">
              ShopeeFood - Freeship cho mọi nẻo đường
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Link
                href="/stores"
                className="rounded-full bg-white px-8 py-3 font-bold text-primary shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                Đặt quán ngay →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h4 className="text-2xl font-extrabold text-white flex items-center gap-2">
                🍜 Food App
              </h4>
              <p className="mt-3 text-sm text-gray-500 max-w-sm leading-relaxed">
                Nền tảng đặt đồ ăn trực tuyến. Chọn quán gần bạn nhất, thêm món, thanh toán và theo dõi lộ trình Shipper tức thời!
              </p>
            </div>
            <div>
              <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Liên kết</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/stores" className="hover:text-white transition-colors">Quán ăn</Link></li>
                <li><Link href="/orders" className="hover:text-white transition-colors">Đơn hàng</Link></li>
                <li><Link href="/profile" className="hover:text-white transition-colors">Tài khoản</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Hỗ trợ</h5>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition-colors cursor-pointer">Về chúng tôi</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Liên hệ</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Chính sách</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
            © 2026 Food App. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
