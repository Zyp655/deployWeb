'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchStores, fetchRecommendedProducts, fetchFlashSaleProducts, Store, RecommendedProduct, FlashSaleProduct } from '@/lib/api/client';
import StarRating from '@/components/StarRating';
import FlashSaleBanner from '@/components/FlashSaleBanner';
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
  const [flashSales, setFlashSales] = useState<FlashSaleProduct[]>([]);
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
          fetchFlashSaleProducts().then(setFlashSales).catch(console.error);
        },
        (error) => {
          console.warn("User denied or error GPS:", error);
          // Fallback to normal fetch
          fetchStores().then(setStores).catch(console.error).finally(() => setLocating(false));
          fetchRecommendedProducts(token || undefined).then(setRecommended).catch(console.error);
          fetchFlashSaleProducts().then(setFlashSales).catch(console.error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      fetchStores().then(setStores).catch(console.error);
      fetchRecommendedProducts(token || undefined).then(setRecommended).catch(console.error);
      fetchFlashSaleProducts().then(setFlashSales).catch(console.error);
    }
  }, [token]);

  const popularStores = stores.slice(0, 4);

  return (
    <main className="min-h-screen bg-white">
      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-gray-50">
        {/* Animated Blob Background */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-accent-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-highlight-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Emojis floating */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          <span className="absolute text-5xl opacity-20 animate-float-slow" style={{ top: '15%', left: '10%' }}>🍜</span>
          <span className="absolute text-6xl opacity-20 animate-float-mid" style={{ top: '25%', right: '12%' }}>🍕</span>
          <span className="absolute text-7xl opacity-15 animate-float-fast" style={{ bottom: '20%', left: '20%' }}>🍣</span>
          <span className="absolute text-5xl opacity-20 animate-float-slow" style={{ bottom: '15%', right: '25%' }}>🥗</span>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 w-full mt-16 md:mt-0">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 text-sm font-bold text-gray-700 mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500"></span>
                </span>
                Siêu sale ẩm thực mỗi ngày
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1]">
                Bản giao hưởng <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">
                  Hương Vị
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-lg leading-relaxed font-medium">
                Khám phá thiên đường ẩm thực quanh bạn. HOANG FOOD dẫn lối đến những quán ăn chất lượng, giao hàng siêu tốc.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Link
                  href="/stores"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-white transition-all duration-200 bg-gray-900 font-pj rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                >
                  Khám phá ngay
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 transition-transform group-hover:translate-x-1">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              
              <div className="mt-12 flex items-center gap-6">
                <div>
                  <p className="text-3xl font-black text-gray-900">{stores.length > 0 ? `${stores.length}+` : '100+'}</p>
                  <p className="text-sm font-semibold text-gray-500">Quán Ăn</p>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div>
                  <p className="text-3xl font-black text-gray-900">15p</p>
                  <p className="text-sm font-semibold text-gray-500">Giao Hàng</p>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div>
                  <p className="text-3xl font-black text-gray-900">4.9⭐</p>
                  <p className="text-sm font-semibold text-gray-500">Đánh Giá</p>
                </div>
              </div>
            </div>

            {/* Right Hero Image/Glass Card */}
            <div className="hidden md:block relative animate-fade-up-delay">
              <div className="relative w-full aspect-square rounded-[3rem] overflow-hidden shadow-2xl shrink-0 border-8 border-white bg-gray-100">
                <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" alt="Delicious Food" className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Floating Glass Badge */}
                <div className="absolute bottom-8 left-8 right-8 glass-panel rounded-2xl p-4 flex items-center gap-4">
                  <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">🍣</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Nhà hàng Sushi Master</p>
                    <p className="text-xs font-semibold text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Đang giao nhanh</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FLASH SALE ═══════ */}
      {flashSales.length > 0 && <FlashSaleBanner products={flashSales} />}

      {/* ═══════ CATEGORIES ═══════ */}
      <section className="mx-auto max-w-6xl px-6 py-10 relative z-20">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Bạn đang thèm gì?</h3>
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/menu?category=${encodeURIComponent(cat.name)}`}
              className="flex-shrink-0 snap-start flex items-center gap-3 rounded-full bg-white px-6 py-4 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-primary-200 hover:-translate-y-1 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
              <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ FLASH SALE ═══════ */}
      <FlashSaleBanner products={flashSales} />

      {/* ═══════ TOP STORES ═══════ */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">🏪 Quán ngon quanh bạn</h2>
            <p className="mt-2 text-gray-500 font-medium tracking-wide">Những tiệm ăn được đánh giá cao nhất</p>
          </div>
          <Link href="/stores" className="hidden sm:flex items-center gap-1 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">
            Xem tất cả <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularStores.map((store, idx) => (
            <Link key={store.id} href={`/stores/${store.id}`} className="w-full">
              <div
                className="group relative flex flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-primary-100 hover:-translate-y-1 h-full"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {store.coverImage ? (
                    <img src={store.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt={store.name} />
                  ) : (
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-500">🏪</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black shadow-sm glass-panel ${store.isOpen ? 'text-green-600' : 'text-gray-600'}`}>
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${store.isOpen ? 'bg-green-600' : 'bg-gray-500'}`}></span>
                      {store.isOpen ? 'Đang mở' : 'Đóng cửa'}
                    </span>
                    {store.distance !== undefined && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black shadow-sm glass-panel text-gray-900">
                        {store.distance < 1 ? `${Math.round(store.distance * 1000)}m` : `${store.distance.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">{store.name}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500 line-clamp-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 shrink-0"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" /></svg>
                    {store.address || 'Đang cập nhật'}
                  </div>
                  <div className="mt-auto pt-4 flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                      <StarRating value={store.rating} readOnly size="sm" />
                      <span className="text-xs font-bold text-gray-700 ml-1">{store.rating > 0 ? store.rating.toFixed(1) : 'Mới'}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-400">• {store.totalOrders} đơn</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ AI RECOMMENDATION (Products) ═══════ */}
      <section className="bg-gray-900 py-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-gradient-to-r from-primary-900/50 to-accent-900/50 blur-[100px] pointer-events-none"></div>
        <div className="mx-auto max-w-6xl px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">AI Gợi Ý Món Ngon <span className="inline-block animate-bounce relative top-1">✨</span></h2>
            <p className="mt-3 text-lg text-gray-400 font-medium">Lựa chọn riêng biệt dựa trên sở thích và xu hướng của bạn</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommended.slice(0, 4).map((product, idx) => {
              return (
                <Link
                  key={product.id}
                  href={`/menu/${product.id}`}
                  className="group relative rounded-3xl bg-gray-800/60 backdrop-blur-md border border-gray-700/50 p-6 transition-all duration-300 hover:bg-gray-800 hover:border-gray-600 hover:shadow-2xl hover:-translate-y-2 flex flex-col justify-between h-full"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/10 rounded-bl-full rounded-tr-3xl -z-10 group-hover:bg-primary-500/20 transition-colors"></div>
                  
                  <div>
                    <div className="w-16 h-16 rounded-2xl bg-gray-700 flex items-center justify-center mb-6 shadow-inner overflow-hidden">
                      {product.image && product.image !== '/images/default.jpg' ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-3xl group-hover:scale-110 transition-transform">{getCategoryEmoji(product.category)}</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors line-clamp-1">{product.name}</h3>
                    <p className="mt-2 text-sm text-gray-400 line-clamp-2 leading-relaxed">{product.recommendReason || 'Một lựa chọn tuyệt vời cho bữa ăn hôm nay.'}</p>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-700/50">
                    <p className="text-xl font-black text-white">{formatPrice(product.price)}</p>
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-primary-600 transition-colors text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ PROMO ═══════ */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="relative overflow-hidden rounded-[2.5rem] p-10 md:p-16 text-center shadow-2xl bg-gray-900 group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-accent-500 to-highlight-500 opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.2)_20%,rgba(255,255,255,0)_40%)] bg-[length:200%_100%] animate-shimmer pointer-events-none opacity-30"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl mb-6 shadow-xl border border-white/30">
              <span className="text-4xl animate-bounce">🎉</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Siêu Khuyến Mãi Đầu Tuần
            </h3>
            <p className="mt-4 text-xl text-white/90 font-medium max-w-xl mx-auto leading-relaxed">
              Freeship toàn bộ đơn hàng <br className="hidden sm:block"/>và giảm ngay 50K cho thành viên mới!
            </p>
            <div className="mt-8">
              <Link
                href="/stores"
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-gray-900 transition-all duration-200 bg-white border border-transparent rounded-full hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-white/20 active:scale-95 shadow-xl hover:shadow-2xl"
              >
                Săn Deal Ngay
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
                🍜 HOANG FOOD
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
              <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Liên hệ</h5>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mt-0.5 text-gray-500 shrink-0">
                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                  </svg>
                  <a href="mailto:huyhoang29012004@gmail.com" className="hover:text-white transition-colors text-gray-400 break-all">huyhoang29012004@gmail.com</a>
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mt-0.5 text-gray-500 shrink-0">
                    <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                  </svg>
                  <a href="tel:0961795006" className="hover:text-white transition-colors text-gray-400">0961795006</a>
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mt-0.5 text-gray-500 shrink-0">
                    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-400">An Khanh - Hai Phong</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
            © 2026 HOANG FOOD. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
