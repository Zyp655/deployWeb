'use client';

import { useEffect, useState } from 'react';
import { fetchProducts, fetchRecommendedProducts, Product, RecommendedProduct } from '@/lib/api/client';
import ProductCard from '@/components/ProductCard';
import { useAuthStore } from '@/store/auth';

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filterVegetarian, setFilterVegetarian] = useState(false);
  const [filterNotSpicy, setFilterNotSpicy] = useState(false);
  const [filterLowCalories, setFilterLowCalories] = useState(false);
  
  const { token } = useAuthStore();

  useEffect(() => {
    const filters: any = {};
    if (filterVegetarian) filters.vegetarian = true;
    if (filterNotSpicy) filters.spicy = false;
    if (filterLowCalories) filters.maxCalories = 500;

    setLoading(true);
    fetchProducts(filters)
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filterVegetarian, filterNotSpicy, filterLowCalories]);

  useEffect(() => {
    fetchRecommendedProducts(token || undefined)
      .then(setRecommended)
      .catch(console.error);
  }, [token]);

  const categories = [
    'Tất cả',
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const filteredProducts =
    selectedCategory === 'Tất cả'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const activeFiltersCount = [filterVegetarian, filterNotSpicy, filterLowCalories].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-highlight px-4 py-16 text-center">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg md:text-5xl">
            🍽️ Thực đơn
          </h1>
          <p className="mt-3 text-lg text-white/90">
            Khám phá các món ăn ngon, giao hàng tận nơi
          </p>
        </div>
        {/* Decorative wave */}
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 80h1440V30c-240 30-480-10-720 20S240 20 0 50v30z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        
        {/* AI Recommendations */}
        {!loading && !error && recommended.length > 0 && (
          <section className="mb-12 rounded-3xl bg-gradient-to-br from-orange-50/50 to-yellow-50/50 p-6 shadow-sm border border-orange-100/50">
            <div className="mb-6 flex items-center gap-3 w-full border-b border-orange-200/50 pb-4">
              <span className="text-3xl">✨</span>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Gợi ý cho bạn</h2>
              <span className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm ml-auto">
                AI Picks
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recommended.map((product) => (
                <div key={`rec-${product.id}`} className="group relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 rounded-xl bg-gray-900/90 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white shadow-xl w-max max-w-[220px] text-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-95 group-hover:scale-100">
                    {product.recommendReason}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
                  </div>
                  <div className="relative z-10 transition-transform duration-300 hover:-translate-y-1">
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-bold text-gray-900">🍔 Tất cả món ăn</h2>
          
          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
            </svg>
            Bộ lọc
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filterVegetarian}
                  onChange={(e) => setFilterVegetarian(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                  🥬 Ăn chay
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filterNotSpicy}
                  onChange={(e) => setFilterNotSpicy(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  ❄️ Không cay
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filterLowCalories}
                  onChange={(e) => setFilterLowCalories(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                  💪 Ít calo (dưới 500)
                </span>
              </label>

              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setFilterVegetarian(false);
                    setFilterNotSpicy(false);
                    setFilterLowCalories(false);
                  }}
                  className="ml-auto text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category filter chips */}
        <div className="mb-8 flex flex-wrap gap-2 px-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'bg-white text-gray-600 shadow-sm hover:bg-primary-50 hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-white shadow-md"
              >
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

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-5xl">😵</span>
            <p className="mt-4 text-lg font-semibold text-gray-700">
              Không thể tải thực đơn
            </p>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-600"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Product grid */}
        {!loading && !error && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <span className="text-5xl">🔍</span>
                <p className="mt-4 text-lg font-semibold text-gray-700">
                  Không tìm thấy món ăn
                </p>
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
      </div>
    </main>
  );
}
