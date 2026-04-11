'use client';

import { useAuthStore } from '@/store/auth';
import { fetchSellerProducts, Product } from '@/lib/api/client';
import { useEffect, useState } from 'react';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Món nước': '🍜', 'Món khô': '🥖', Cơm: '🍚', 'Khai vị': '🥗',
    'Món mặn': '🥩', 'Tráng miệng': '🍮', 'Đồ uống': '🍵',
  };
  return map[category] || '🍽️';
}

export default function SellerProductsPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchSellerProducts(token)
        .then(setProducts)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map((i) => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">🍔 Sản phẩm</h2>
          <p className="text-gray-500 mt-1">Quản lý các món ăn của cửa hàng</p>
        </div>
        <span className="text-sm text-gray-500">{products.length} sản phẩm</span>
      </header>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl"><span className="text-5xl">🍽️</span><p className="mt-3 text-gray-500">Chưa có sản phẩm nào</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="h-36 bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
                <span className="text-6xl">{getCategoryEmoji(product.category)}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-full">{product.category}</span>
                  {product.isSpicy && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">🌶 Cay</span>}
                  {product.isVegetarian && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">🌿 Chay</span>}
                </div>
                <h3 className="text-base font-bold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-extrabold text-primary">{formatPrice(product.price)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.isAvailable ? 'Đang bán' : 'Tạm ẩn'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
