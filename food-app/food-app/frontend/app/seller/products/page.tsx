'use client';

import { useAuthStore } from '@/store/auth';
import { fetchSellerProducts, Product, updateSellerProduct, createSellerProduct, deleteSellerProduct, toggleSellerProduct, uploadImage, OptionGroup } from '@/lib/api/client';
import OptionBuilder from '@/components/OptionBuilder';
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

const CATEGORIES = ['Món nước', 'Món khô', 'Cơm', 'Khai vị', 'Món mặn', 'Tráng miệng', 'Đồ uống', 'Khác'];

export default function SellerProductsPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Thời gian Modal
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // CRUD Modal
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    category: string;
    image: string;
    isSpicy: boolean;
    isVegetarian: boolean;
    options: OptionGroup[];
  }>({
    name: '',
    description: '',
    price: '',
    category: 'Món mặn',
    image: '',
    isSpicy: false,
    isVegetarian: false,
    options: [],
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    
    try {
      setIsUploading(true);
      const res = await uploadImage(file, token);
      setFormData(prev => ({ ...prev, image: res.url }));
    } catch (err) {
      alert('Tải ảnh thất bại');
    } finally {
      setIsUploading(false);
    }
  };

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

  const openProductModal = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setFormData({
        name: p.name,
        description: p.description || '',
        price: p.price.toString(),
        category: p.category,
        image: p.image || '',
        isSpicy: p.isSpicy || false,
        isVegetarian: p.isVegetarian || false,
        options: p.options || [],
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: CATEGORIES[0],
        image: '',
        isSpicy: false,
        isVegetarian: false,
        options: [],
      });
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        image: formData.image || undefined,
        isSpicy: formData.isSpicy,
        isVegetarian: formData.isVegetarian,
        options: formData.options,
      };

      if (editingProduct) {
        const updated = await updateSellerProduct(editingProduct.id, payload, token);
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await createSellerProduct(payload, token);
        setProducts([created, ...products]);
      }
      setProductModalOpen(false);
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi lưu món ăn');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!token) return;
    if (!window.confirm(`Bạn có chắc muốn xóa món "${name}" không?`)) return;

    try {
      await deleteSellerProduct(id, token);
      loadProducts();
    } catch (error: any) {
      alert(error.message || 'Không thể xóa món ăn');
    }
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
        <button 
          onClick={() => openProductModal()}
          className="bg-primary hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
        >
          <span>➕</span> Thêm món mới
        </button>
      </header>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <span className="text-5xl">🍽️</span>
          <p className="mt-3 text-gray-500 font-medium">Chưa có sản phẩm nào</p>
          <button onClick={() => openProductModal()} className="mt-4 text-primary font-bold hover:underline">
            Tạo món ăn đầu tiên của bạn
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md flex flex-col group">
              <div className="h-40 bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center relative">
                {product.image && product.image !== '/images/default.jpg' ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">{getCategoryEmoji(product.category)}</span>
                )}
                
                {/* Overlay actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openProductModal(product)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-blue-600 flex items-center justify-center shadow hover:bg-blue-50" title="Sửa chi tiết">✏️</button>
                  <button onClick={() => handleDeleteProduct(product.id, product.name)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-red-600 flex items-center justify-center shadow hover:bg-red-50" title="Xóa món">🗑️</button>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-full">{product.category}</span>
                  {product.isSpicy && <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">🌶 Cay</span>}
                  {product.isVegetarian && <span className="text-[10px] uppercase tracking-wider font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">🌿 Chay</span>}
                </div>
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">{product.description || 'Chưa có mô tả'}</p>
                
                <div className="mt-4 flex items-center justify-between bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                  <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    ⏱️ {product.saleStartTime || product.saleEndTime ? 
                      <span className="font-bold text-primary">{product.saleStartTime || '00:00'} - {product.saleEndTime || '23:59'}</span>
                      : 'Bán cả ngày'
                    }
                  </span>
                  <button 
                    onClick={() => openTimeEditor(product)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Đổi giờ
                  </button>
                </div>

                <div className="mt-3 flex flex-none items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-lg font-black text-primary">{formatPrice(product.price)}</span>
                  <button 
                    onClick={() => handleToggle(product.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${product.isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
                  className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2 focus:border-primary focus:ring-primary font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Giờ kết thúc</label>
                <input 
                  type="time" 
                  value={editEndTime}
                  onChange={e => setEditEndTime(e.target.value)}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2 focus:border-primary focus:ring-primary font-medium transition-all"
                />
              </div>
              <p className="text-xs text-blue-600 bg-blue-50 p-2.5 rounded-lg flex gap-2">
                <span>💡</span> <span>Xóa trống cả 2 ô để áp dụng bán tự do không giới hạn giờ.</span>
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setEditingTimeId(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-700 transition-all hover:bg-gray-200 active:scale-95"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveTime}
                className="flex-[2] rounded-xl bg-primary py-3 font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Lưu Khung Giờ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CRUD Sản phẩm */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto pt-20 pb-20">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl relative my-auto">
            <button 
              onClick={() => setProductModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
            >
              ✕
            </button>
            
            <h3 className="text-2xl font-extrabold text-gray-900 mb-6">
              {editingProduct ? '✏️ Cập nhật món ăn' : '🍔 Thêm món mới'}
            </h3>
            
            <form onSubmit={handleSaveProduct} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên món ăn <span className="text-red-500">*</span></label>
                  <input 
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: Cơm tấm sườn bì chả"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-primary focus:ring-primary focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    placeholder="VD: 35000"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-primary focus:ring-primary focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Danh mục <span className="text-red-500">*</span></label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-primary focus:ring-primary focus:bg-white transition-all font-medium"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hình ảnh món ăn</label>
                  <div className="flex gap-4 items-center">
                    {formData.image && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
                        <img 
                          src={formData.image.startsWith('http') ? formData.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${formData.image}`} 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input 
                        type="url"
                        value={formData.image}
                        onChange={e => setFormData({...formData, image: e.target.value})}
                        placeholder="Dán link ảnh hoặc click nút tải lên..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 focus:border-primary focus:ring-primary focus:bg-white transition-all font-medium text-sm"
                      />
                      <label className={`flex items-center gap-2 cursor-pointer w-max px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-bold text-gray-700 transition shadow-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span>{isUploading ? '⏳ Đang tải lên...' : '📤 Chọn ảnh từ máy'}</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={handleUploadFile}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả chi tiết</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Nguyên liệu, cách chế biến, lưu ý cho khách hàng..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-primary focus:ring-primary focus:bg-white transition-all font-medium resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isSpicy}
                    onChange={e => setFormData({...formData, isSpicy: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="font-bold text-gray-700 flex items-center gap-1">🌶 Món cay</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isVegetarian}
                    onChange={e => setFormData({...formData, isVegetarian: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
                  />
                  <span className="font-bold text-gray-700 flex items-center gap-1">🌿 Món chay</span>
                </label>
              </div>

              {/* Tùy chọn Component */}
              <div className="mt-6 border-t border-gray-100 pt-6">
                <OptionBuilder 
                  options={formData.options} 
                  onChange={(opts) => setFormData({ ...formData, options: opts })} 
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-6 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 font-bold text-white bg-primary hover:bg-primary-600 hover:shadow-lg shadow-sm active:scale-95 rounded-xl transition-all"
                >
                  {editingProduct ? 'Lưu thay đổi' : 'Tạo món ăn'}
                </button>
              </div>
              
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
