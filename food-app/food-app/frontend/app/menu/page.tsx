'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { fetchProducts, fetchRecommendedProducts, Product, RecommendedProduct, searchSemanticProducts } from '@/lib/api/client';
import ProductCard from '@/components/ProductCard';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555126634-ae23555239e0?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1200&auto=format&fit=crop',
];

const CATEGORY_DATA = [
  { emoji: '🍜', name: 'Món nước', color: 'from-red-500 to-orange-400', bg: 'bg-red-50' },
  { emoji: '🥖', name: 'Món khô', color: 'from-amber-500 to-yellow-400', bg: 'bg-amber-50' },
  { emoji: '🍚', name: 'Cơm', color: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50' },
  { emoji: '🥗', name: 'Khai vị', color: 'from-green-500 to-lime-400', bg: 'bg-green-50' },
  { emoji: '🥩', name: 'Món mặn', color: 'from-rose-500 to-pink-400', bg: 'bg-rose-50' },
  { emoji: '🍮', name: 'Tráng miệng', color: 'from-purple-500 to-fuchsia-400', bg: 'bg-purple-50' },
  { emoji: '🍵', name: 'Đồ uống', color: 'from-cyan-500 to-blue-400', bg: 'bg-cyan-50' },
  { emoji: '🔥', name: 'Món đặc biệt', color: 'from-orange-500 to-red-400', bg: 'bg-orange-50' },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

function getCategoryEmoji(category: string): string {
  return CATEGORY_DATA.find((c) => c.name === category)?.emoji || '🍽️';
}

function resolveImageUrl(url: string | null) {
  if (!url || url === '/images/default.jpg') return null;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${url}`;
}

function FeaturedCard({ product }: { product: RecommendedProduct }) {
  const [imgErr, setImgErr] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const imgUrl = resolveImageUrl(product.image);

  return (
    <Link href={`/menu/${product.id}`} className="flex-shrink-0 w-[320px] snap-start">
      <div className="group relative h-[400px] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
        {imgUrl && !imgErr ? (
          <img
            src={imgUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-200 via-accent-100 to-highlight-200 flex items-center justify-center">
            <span className="text-8xl">{getCategoryEmoji(product.category)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white border border-white/20">
            ✨ AI Gợi ý
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className="text-xs font-bold text-white/70 uppercase tracking-widest">{product.category}</span>
          <h3 className="mt-1 text-2xl font-black text-white leading-tight line-clamp-2">{product.name}</h3>
          <p className="mt-2 text-sm text-white/70 line-clamp-2">{product.recommendReason || product.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-black text-white">{formatPrice(product.price)}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  addItem(product);
                  openCart();
                } catch (err: any) {
                  if (err.message === 'DIFFERENT_STORE') {
                    const ok = window.confirm('Quán khác với giỏ hàng hiện tại. Xóa giỏ và thêm món mới?');
                    if (ok) {
                      useCartStore.getState().clearAndAddItem(product);
                      openCart();
                    }
                  }
                }
              }}
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary shadow-lg hover:scale-110 active:scale-95 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PromoBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gray-900 p-8 md:p-12 group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-accent-500 to-highlight-500 opacity-90" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.15)_20%,rgba(255,255,255,0)_40%)] bg-[length:200%_100%] animate-shimmer pointer-events-none" />
      <div className="absolute -right-10 -bottom-10 text-[120px] opacity-20 rotate-12 select-none pointer-events-none">🎉</div>
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-bold text-white mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Đang diễn ra
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Freeship + Giảm 30K
          </h3>
          <p className="mt-3 text-white/80 font-medium max-w-md">
            Đơn từ 100K được miễn phí ship và giảm ngay 30K. Dùng mã <span className="font-black text-white bg-white/20 px-2 py-0.5 rounded-lg">SALE30K</span>
          </p>
        </div>
        <Link
          href="/stores"
          className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-black rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          Đặt ngay
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function TrustBadges() {
  const badges = [
    { icon: '🚀', label: 'Giao nhanh', desc: 'Trong 15 phút' },
    { icon: '⭐', label: 'Uy tín', desc: '4.9 đánh giá' },
    { icon: '🛡️', label: 'An toàn', desc: 'VSATTP đạt chuẩn' },
    { icon: '💰', label: 'Tiết kiệm', desc: 'Giá tốt nhất' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map((b) => (
        <div key={b.label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
            {b.icon}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{b.label}</p>
            <p className="text-xs text-gray-500 font-medium">{b.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVegetarian, setFilterVegetarian] = useState(false);
  const [filterNotSpicy, setFilterNotSpicy] = useState(false);
  const [filterLowCalories, setFilterLowCalories] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        if (searchQuery.trim()) {
          const res = await searchSemanticProducts(searchQuery.trim(), token || undefined);
          setProducts(res.results);
        } else {
          const filters: any = {};
          if (filterVegetarian) filters.vegetarian = true;
          if (filterNotSpicy) filters.spicy = false;
          if (filterLowCalories) filters.maxCalories = 500;
          const normalProducts = await fetchProducts(filters);
          setProducts(normalProducts);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [filterVegetarian, filterNotSpicy, filterLowCalories, searchQuery, token]);

  useEffect(() => {
    fetchRecommendedProducts(token || undefined)
      .then(setRecommended)
      .catch(console.error);
  }, [token]);

  const categories = ['Tất cả', ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = selectedCategory === 'Tất cả' ? products : products.filter((p) => p.category === selectedCategory);
  const activeFiltersCount = [filterVegetarian, filterNotSpicy, filterLowCalories].filter(Boolean).length;

  const bestSellers = [...products].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 3);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ═══════ HERO BANNER ═══════ */}
      <section className="relative h-[420px] md:h-[480px] overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt="Food hero"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === heroIdx ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-gray-900/30" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-5 py-2 text-sm font-bold text-white border border-white/20 mb-6">
            <span className="text-lg">🍜</span>
            HOANG FOOD — Thực đơn hôm nay
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-3xl">
            Khám phá <span className="text-transparent bg-clip-text bg-gradient-to-r from-highlight-300 to-accent-300">hương vị</span> bạn yêu thích
          </h1>
          <p className="mt-4 text-lg text-white/80 font-medium max-w-xl">
            Hàng trăm món ngon từ các quán ăn uy tín, giao tận nơi trong 15 phút
          </p>

          <div className="mt-8 w-full max-w-xl">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Tìm phở, bún chả, trà sữa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border-0 bg-white/95 backdrop-blur-md pl-14 pr-6 py-4 text-base font-medium text-gray-900 shadow-2xl placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIdx ? 'w-8 bg-white' : 'w-3 bg-white/40'}`}
            />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 -mt-6 relative z-20">
        {/* ═══════ TRUST BADGES ═══════ */}
        <TrustBadges />

        {/* ═══════ CATEGORY QUICK NAV ═══════ */}
        <section className="mt-10">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6">Bạn đang thèm gì?</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {CATEGORY_DATA.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name === selectedCategory ? 'Tất cả' : cat.name)}
                className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${
                  selectedCategory === cat.name
                    ? 'bg-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30'
                    : `${cat.bg} hover:shadow-md`
                }`}
              >
                <span className={`text-3xl transition-transform duration-300 group-hover:scale-110 ${selectedCategory === cat.name ? 'scale-110' : ''}`}>
                  {cat.emoji}
                </span>
                <span className={`text-xs font-bold whitespace-nowrap ${selectedCategory === cat.name ? 'text-white' : 'text-gray-700'}`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ═══════ AI FEATURED PICKS — Horizontal Scroll ═══════ */}
        {!loading && !error && recommended.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-lg shadow-lg shadow-orange-500/30">
                  ✨
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">AI Gợi ý cho bạn</h2>
                  <p className="text-sm text-gray-500 font-medium">Dựa trên sở thích và xu hướng</p>
                </div>
              </div>
              <button
                onClick={() => scrollRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}
                className="hidden md:flex w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-lg transition-all"
              >
                →
              </button>
            </div>
            <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {recommended.map((product) => (
                <FeaturedCard key={`featured-${product.id}`} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ═══════ PROMO BANNER ═══════ */}
        <section className="mt-12">
          <PromoBanner />
        </section>

        {/* ═══════ BEST SELLERS ═══════ */}
        {!loading && !error && bestSellers.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white text-lg shadow-lg shadow-red-500/30">
                🔥
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Bán chạy nhất</h2>
                <p className="text-sm text-gray-500 font-medium">Được yêu thích bởi hàng ngàn khách hàng</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bestSellers.map((product, idx) => (
                <Link key={`best-${product.id}`} href={`/menu/${product.id}`} className="group">
                  <div className="relative rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="relative h-52 overflow-hidden">
                      {resolveImageUrl(product.image) ? (
                        <img
                          src={resolveImageUrl(product.image)!}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                          <span className="text-6xl">{getCategoryEmoji(product.category)}</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 bg-yellow-400 text-gray-900 rounded-full px-3 py-1.5 text-xs font-black shadow-lg">
                          #{idx + 1} Top bán chạy
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-primary bg-primary-50 px-2.5 py-1 rounded-full">{product.category}</span>
                        {product.averageRating && product.averageRating > 0 && (
                          <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full">
                            ⭐ {product.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-1">{product.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xl font-black text-primary">{formatPrice(product.price)}</span>
                        <span className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════ ALL PRODUCTS SECTION ═══════ */}
        <section className="mt-12 mb-16">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white text-lg shadow-lg">
                🍔
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Tất cả món ăn</h2>
                <p className="text-sm text-gray-500 font-medium">{filteredProducts.length} món{selectedCategory !== 'Tất cả' ? ` trong "${selectedCategory}"` : ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 border ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-white text-gray-700 border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
                </svg>
                Bộ lọc
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white text-primary text-xs font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm border border-gray-100 animate-fade-up">
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer rounded-xl bg-gray-50 px-4 py-3 hover:bg-green-50 transition-colors group">
                  <input
                    type="checkbox"
                    checked={filterVegetarian}
                    onChange={(e) => setFilterVegetarian(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-bold text-gray-700 group-hover:text-green-600 transition-colors">🥬 Ăn chay</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer rounded-xl bg-gray-50 px-4 py-3 hover:bg-blue-50 transition-colors group">
                  <input
                    type="checkbox"
                    checked={filterNotSpicy}
                    onChange={(e) => setFilterNotSpicy(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">❄️ Không cay</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer rounded-xl bg-gray-50 px-4 py-3 hover:bg-purple-50 transition-colors group">
                  <input
                    type="checkbox"
                    checked={filterLowCalories}
                    onChange={(e) => setFilterLowCalories(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-bold text-gray-700 group-hover:text-purple-600 transition-colors">💪 Ít calo (&lt;500)</span>
                </label>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => { setFilterVegetarian(false); setFilterNotSpicy(false); setFilterLowCalories(false); }}
                    className="ml-auto text-sm font-bold text-red-500 hover:text-red-600 transition-colors px-4 py-3"
                  >
                    Xóa bộ lọc ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Category pills */}
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                    : 'bg-white text-gray-600 shadow-sm hover:bg-gray-100 border border-gray-100'
                }`}
              >
                {cat !== 'Tất cả' && <span className="mr-1">{getCategoryEmoji(cat)}</span>}
                {cat}
              </button>
            ))}
          </div>

          {loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white shadow-md">
                  <div className="h-48 rounded-t-2xl bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 w-full rounded bg-gray-100" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-6 w-24 rounded bg-gray-200" />
                      <div className="h-9 w-20 rounded-full bg-gray-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-white border border-gray-100">
              <span className="text-6xl">😵</span>
              <p className="mt-4 text-lg font-bold text-gray-700">Không thể tải thực đơn</p>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 shadow-md transition-all"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-white border border-dashed border-gray-200">
                  <span className="text-6xl">🔍</span>
                  <p className="mt-4 text-lg font-bold text-gray-700">Không tìm thấy món ăn</p>
                  <p className="mt-1 text-sm text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  <button
                    onClick={() => { setSelectedCategory('Tất cả'); setSearchQuery(''); }}
                    className="mt-4 text-primary font-bold hover:underline"
                  >
                    Xem tất cả món ăn
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
