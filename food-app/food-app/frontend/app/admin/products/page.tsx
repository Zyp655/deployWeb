'use client';

import { useAuthStore } from '@/store/auth';
import { fetchProducts, createAdminProduct, Product } from '@/lib/api/client';
import { useEffect, useState } from 'react';

export default function AdminProductsPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (token) {
      loadProducts();
    }
  }, [token]);

  const loadProducts = () => {
    fetchProducts().then(setProducts).finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdminProduct({ name, description: desc, price: Number(price), category }, token!);
      loadProducts();
      setName(''); setDesc(''); setPrice(''); setCategory('');
    } catch {
      alert('Lỗi thêm món');
    }
  };

  if (loading) return <div className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">✨ Thêm Món Mới</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Tên món</label>
            <input required placeholder="VD: Gà rán" value={name} onChange={e=>setName(e.target.value)} className="w-full border p-3 rounded-xl bg-gray-50 focus:border-primary focus:ring-1 outline-none transition-all" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Danh mục</label>
            <input required placeholder="VD: Đồ uống" value={category} onChange={e=>setCategory(e.target.value)} className="w-full border p-3 rounded-xl bg-gray-50 focus:border-primary focus:ring-1 outline-none transition-all" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Giá (VNĐ)</label>
            <input required type="number" placeholder="VD: 50000" value={price} onChange={e=>setPrice(e.target.value)} className="w-full border p-3 rounded-xl bg-gray-50 focus:border-primary focus:ring-1 outline-none transition-all" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Mô tả chi tiết</label>
            <input placeholder="Thơm ngon mời bạn ăn nha..." value={desc} onChange={e=>setDesc(e.target.value)} className="w-full border p-3 rounded-xl bg-gray-50 focus:border-primary focus:ring-1 outline-none transition-all" />
          </div>
          <button type="submit" className="md:col-span-2 bg-gradient-to-r from-primary to-accent text-white font-extrabold py-3.5 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
            + Thêm Món Ăn
          </button>
        </form>
      </div>

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
