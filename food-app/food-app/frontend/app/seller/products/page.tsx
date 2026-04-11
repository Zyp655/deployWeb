'use client';

import { useAuthStore } from '@/store/auth';
import { fetchSellerProducts, Product, updateSellerProduct } from '@/lib/api/client';
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
  
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  const loadProducts = () => {
    if (token) {
      setLoading(true);
      fetchSellerProducts(token)
        .then(setProducts)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadProducts();
  }, [token]);

  const handleToggle = async (productId: string) => {
    if (!token) return;
    try {
      const { toggleSellerProduct } = await import('@/lib/api/client');
      await toggleSellerProduct(productId, token);
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p
      ));
    } catch (e) {
      alert('Không thể thay đổi trạng thái');
    }
  };

  const handleSaveTime = async () => {
    if (!token || !editingTimeId) return;
    try {
      const payload = {
        saleStartTime: editStartTime || null,
        saleEndTime: editEndTime || null,
      };
      await updateSellerProduct(editingTimeId, payload, token);
      
      setProducts(prev => prev.map(p => 
        p.id === editingTimeId ? { ...p, ...payload } : p
      ));
      setEditingTimeId(null);
    } catch (e) {
      alert('Lỗi lưu thời gian');
    }
  };

  const openTimeEditor = (p: Product) => {
    setEditingTimeId(p.id);
    setEditStartTime(p.saleStartTime || '');
    setEditEndTime(p.saleEndTime || '');
  };

  if (loading && products.length === 0) {
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
                
                <div className="mt-3 flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="text-xs font-medium text-gray-600">
                    ⏱️ Khung giờ: {product.saleStartTime || product.saleEndTime ? 
                      <span className="font-bold text-primary">{product.saleStartTime || '00:00'} - {product.saleEndTime || '23:59'}</span>
                      : 'Bán cả ngày'
                    }
                  </span>
                  <button 
                    onClick={() => openTimeEditor(product)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Sửa
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-extrabold text-primary">{formatPrice(product.price)}</span>
                  <button 
                    onClick={() => handleToggle(product.id)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${product.isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    {product.isAvailable ? '🟢 Đang bán' : '🔴 Tạm ẩn'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chỉnh sửa Khung Giờ */}
      {editingTimeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">⏱️ Khung giờ bán</h3>
            <p className="text-sm text-gray-500 mb-6">Thiết lập thời gian bán để tự động ẩn hiện món ăn.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Giờ bắt đầu</label>
                <input 
                  type="time" 
                  value={editStartTime}
                  onChange={e => setEditStartTime(e.target.value)}
                  className="w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 focus:border-primary focus:ring-primary font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Giờ kết thúc</label>
                <input 
                  type="time" 
                  value={editEndTime}
                  onChange={e => setEditEndTime(e.target.value)}
                  className="w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 focus:border-primary focus:ring-primary font-medium"
                />
              </div>
              <p className="text-xs text-blue-600 block bg-blue-50 p-2 rounded-lg">Mẹo: Xóa trống để áp dụng bán cả ngày.</p>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setEditingTimeId(null)}
                className="flex-1 rounded-2xl bg-gray-100 py-3 font-bold text-gray-700 transition-all hover:bg-gray-200 active:scale-95"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveTime}
                className="flex-[2] rounded-2xl bg-primary py-3 font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                Lưu Khung Giờ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
