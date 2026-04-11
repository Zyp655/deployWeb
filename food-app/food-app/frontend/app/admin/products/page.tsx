'use client';

import { useAuthStore } from '@/store/auth';
import { fetchProducts, Product } from '@/lib/api/client';
import { useEffect, useState } from 'react';

export default function AdminProductsPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadProducts();
    }
  }, [token]);

  const loadProducts = () => {
    fetchProducts().then(setProducts).finally(() => setLoading(false));
  };

  if (loading) return <div className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Danh sách Món ăn</h2>
          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">{products.length} Sản phẩm</span>
        </div>
        <table className="w-full text-left font-medium text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-4">Món</th>
              <th className="px-6 py-4">Danh mục</th>
              <th className="px-6 py-4 text-right">Giá</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-900 font-bold">{p.name}</td>
                <td className="px-6 py-4 text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 flex w-max rounded-md shadow-sm">{p.category}</span>
                </td>
                <td className="px-6 py-4 text-right text-primary font-bold">
                  {new Intl.NumberFormat('vi-VN').format(p.price)} đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
