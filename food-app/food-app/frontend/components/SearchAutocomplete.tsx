'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchSearchSuggestions } from '@/lib/api/client';

const CATEGORY_DATA = [
  { emoji: '🍜', name: 'Món nước' },
  { emoji: '🥖', name: 'Món khô' },
  { emoji: '🍚', name: 'Cơm' },
  { emoji: '🥗', name: 'Khai vị' },
  { emoji: '🥩', name: 'Món mặn' },
  { emoji: '🍮', name: 'Tráng miệng' },
  { emoji: '🍵', name: 'Đồ uống' },
  { emoji: '🔥', name: 'Món đặc biệt' },
];

function getCategoryEmoji(category: string): string {
  return CATEGORY_DATA.find((c) => c.name === category)?.emoji || '🍽️';
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ products: any[]; stores: any[] }>({ products: [], stores: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions({ products: [], stores: [] });
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetchSearchSuggestions(query.trim());
        setSuggestions(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/menu?search=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm hidden md:block">
      <form onSubmit={handleSubmit} className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Bạn muốn ăn gì?"
          className="w-full rounded-full bg-gray-100 pl-10 pr-4 py-2 text-sm font-medium text-gray-900 border-2 border-transparent focus:bg-white focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); setSuggestions({ products: [], stores: [] }); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </form>

      {isOpen && (suggestions.products.length > 0 || suggestions.stores.length > 0 || loading) && (
        <div className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100] max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="py-2">
              {suggestions.stores.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Quán ăn</div>
                  {suggestions.stores.map((store) => (
                    <Link
                      key={`store-${store.id}`}
                      href={`/stores`} // Or `/stores/${store.id}` if available
                      onClick={() => { setIsOpen(false); setQuery(''); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-xl">🏪</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{store.name}</p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300">
                        <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}

              {suggestions.products.length > 0 && (
                <div>
                  <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Món ăn</div>
                  {suggestions.products.map((product) => (
                    <Link
                      key={`prod-${product.id}`}
                      href={`/menu/${product.id}`}
                      onClick={() => { setIsOpen(false); setQuery(''); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center text-lg shadow-sm">
                        {getCategoryEmoji(product.category)}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{product.name}</p>
                        <p className="text-xs font-semibold text-primary/80">{formatPrice(product.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
