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

const resolveImageUrl = (url: string | null) => {
  if (!url || url === '/images/default.jpg') return null;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${url}`;
};

function ProductImageRender({ product }: { product: Product }) {
  const [error, setError] = useState(false);
  const url = resolveImageUrl(product.image);

  useEffect(() => {
    setError(false);
  }, [url]);

  if (!url || error) {
    return <span className="text-6xl">{getCategoryEmoji(product.category)}</span>;
  }

  return (
    <img
      src={url}
      alt={product.name}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
}

export default function SellerProductsPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

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
    salePrice: string;
    flashSaleStart: string;
    flashSaleEnd: string;
    options: OptionGroup[];
  }>({
    name: '',
    description: '',
    price: '',
    category: 'Món mặn',
    image: '',
    isSpicy: false,
    isVegetarian: false,
    salePrice: '',
    flashSaleStart: '',
    flashSaleEnd: '',
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
        salePrice: p.salePrice ? p.salePrice.toString() : '',
        flashSaleStart: p.flashSaleStart ? new Date(p.flashSaleStart).toISOString().slice(0, 16) : '',
        flashSaleEnd: p.flashSaleEnd ? new Date(p.flashSaleEnd).toISOString().slice(0, 16) : '',
        options: p.options || [],
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '', description: '', price: '', category: CATEGORIES[0],
        image: '', isSpicy: false, isVegetarian: false, salePrice: '', flashSaleStart: '', flashSaleEnd: '', options: [],
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
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        flashSaleStart: formData.flashSaleStart ? new Date(formData.flashSaleStart).toISOString() : null,
        flashSaleEnd: formData.flashSaleEnd ? new Date(formData.flashSaleEnd).toISOString() : null,
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
          <h2 className="ds-heading text-3xl font-extrabold text-[#1a1a2e]">🍔 Sản phẩm</h2>
          <p className="text-[#5b403d] mt-1 text-sm">Quản lý các món ăn của cửa hàng</p>
        </div>
        <button
          onClick={() => openProductModal()}
          className="ds-gradient-cta px-5 py-2.5 flex items-center gap-2 text-sm"
        >
          <span>➕</span> Thêm món mới
        </button>
      </header>

      {products.length === 0 ? (
        <div className="text-center py-16 ds-card border-2 border-dashed border-[#e4beb9]">
          <span className="text-5xl">🍽️</span>
          <p className="mt-3 text-[#906f6c] font-medium">Chưa có sản phẩm nào</p>
          <button onClick={() => openProductModal()} className="mt-4 text-primary font-bold hover:underline">
            Tạo món ăn đầu tiên của bạn
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className={`ds-card overflow-hidden flex flex-col group transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_50px_rgba(26,26,46,0.1)] ${!product.isAvailable ? 'opacity-70' : ''}`}>
              <div className="h-40 bg-gradient-to-br from-[#f5f2ff] to-[#efecff] flex items-center justify-center relative">
                <ProductImageRender product={product} />
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-[#1a1a2e]/40 flex items-center justify-center">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      🔴 Đã ẩn
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">{product.category}</span>
                  {product.isSpicy && <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">🌶 Cay</span>}
                  {product.isVegetarian && <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">🌿 Chay</span>}
                  {product.salePrice && <span className="text-[10px] uppercase tracking-wider font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 px-2 py-0.5 rounded-full shadow-sm">🔥 Flash Sale</span>}
                </div>
                <h3 className="text-lg font-bold text-[#1a1a2e] line-clamp-1">{product.name}</h3>
                <p className="text-sm text-[#906f6c] mt-1 line-clamp-2 flex-1">{product.description || 'Chưa có mô tả'}</p>

                <div className="mt-4 flex items-center justify-between bg-[#f5f2ff] p-2 rounded-lg">
                  <span className="text-xs font-medium text-[#5b403d] flex items-center gap-1">
                    ⏱️ {product.saleStartTime || product.saleEndTime ?
                      <span className="font-bold text-primary">{product.saleStartTime || '00:00'} - {product.saleEndTime || '23:59'}</span>
                      : 'Bán cả ngày'
                    }
                  </span>
                  <button onClick={() => openTimeEditor(product)} className="text-xs text-primary font-bold hover:underline">
                    Đổi giờ
                  </button>
                </div>

                <div className="mt-3 flex flex-none items-center justify-between pt-3 border-t border-[#efecff]">
                  <div className="flex flex-col">
                     {product.salePrice && (
                       <span className="text-xs text-gray-400 line-through mb-0.5">
                         {formatPrice(product.price)}
                       </span>
                     )}
                     <span className={`text-lg font-black ${product.salePrice ? 'text-red-600' : 'text-primary'}`}>
                       {formatPrice(product.salePrice || product.price)}
                     </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between bg-[#f5f2ff] rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(product.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                        product.isAvailable ? 'bg-emerald-500' : 'bg-[#e4beb9]'
                      }`}
                      title={product.isAvailable ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                        product.isAvailable ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className={`text-xs font-bold ${product.isAvailable ? 'text-emerald-600' : 'text-[#906f6c]'}`}>
                      {product.isAvailable ? 'Đang bán' : 'Đã ẩn'}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openProductModal(product)}
                      className="w-8 h-8 rounded-lg bg-[#efecff] text-[#5b403d] flex items-center justify-center hover:bg-[#e8e5ff] transition-all active:scale-90"
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-all active:scale-90"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTimeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a2e]/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl ds-card p-6 shadow-2xl">
            <h3 className="ds-heading text-xl font-extrabold text-[#1a1a2e] mb-2">⏱️ Khung giờ bán</h3>
            <p className="text-sm text-[#5b403d] mb-6">Thiết lập thời gian bán để tự động ẩn hiện món ăn.</p>
            <div className="space-y-4">
              <div>
                <label className="ds-label mb-1 block">Giờ bắt đầu</label>
                <input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} className="ds-input" />
              </div>
              <div>
                <label className="ds-label mb-1 block">Giờ kết thúc</label>
                <input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} className="ds-input" />
              </div>
              <p className="text-xs text-primary bg-primary/5 p-2.5 rounded-lg flex gap-2">
                <span>💡</span> <span>Xóa trống cả 2 ô để bán tự do không giới hạn giờ.</span>
              </p>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setEditingTimeId(null)} className="flex-1 rounded-xl bg-[#efecff] py-3 font-bold text-[#5b403d] transition-all hover:bg-[#e8e5ff] active:scale-95">
                Hủy
              </button>
              <button onClick={handleSaveTime} className="flex-[2] ds-gradient-cta py-3 text-sm">
                Lưu Khung Giờ
              </button>
            </div>
          </div>
        </div>
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a2e]/60 backdrop-blur-sm p-4 overflow-y-auto pt-20 pb-20">
          <div className="w-full max-w-xl rounded-3xl ds-card p-6 md:p-8 shadow-2xl relative my-auto">
            <button
              onClick={() => setProductModalOpen(false)}
              className="absolute top-4 right-4 text-[#906f6c] hover:text-[#1a1a2e] hover:bg-[#efecff] p-2 rounded-full transition-all"
            >
              ✕
            </button>
            <h3 className="ds-heading text-2xl font-extrabold text-[#1a1a2e] mb-6">
              {editingProduct ? '✏️ Cập nhật món ăn' : '🍔 Thêm món mới'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="ds-label mb-1 block">Tên món ăn <span className="text-primary">*</span></label>
                  <input required maxLength={100} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Cơm tấm sườn bì chả" className="ds-input" />
                </div>
                <div>
                  <label className="ds-label mb-1 block">Giá bán (VNĐ) <span className="text-primary">*</span></label>
                  <input required type="number" min="0" step="1000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="VD: 35000" className="ds-input" />
                </div>
                <div>
                  <label className="ds-label mb-1 block">Danh mục <span className="text-primary">*</span></label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="ds-input">
                    {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="ds-label mb-2 block">Hình ảnh món ăn</label>
                  <div className="flex gap-4 items-center">
                    {formData.image && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#efecff] flex-shrink-0 bg-[#f5f2ff]">
                        <img
                          src={formData.image.startsWith('http') ? formData.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${formData.image}`}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="Dán link ảnh hoặc click nút tải lên..." className="ds-input text-sm" />
                      <label className={`flex items-center gap-2 cursor-pointer w-max px-4 py-2 bg-[#efecff] rounded-xl hover:bg-[#e8e5ff] text-sm font-bold text-[#5b403d] transition shadow-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span>{isUploading ? '⏳ Đang tải lên...' : '📤 Chọn ảnh từ máy'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleUploadFile} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="ds-label mb-1 block">Mô tả chi tiết</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Nguyên liệu, cách chế biến, lưu ý cho khách hàng..." className="ds-input resize-none" />
                </div>
              </div>
              <div className="flex gap-6 p-4 rounded-xl bg-[#f5f2ff]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.isSpicy} onChange={e => setFormData({...formData, isSpicy: e.target.checked})} className="w-5 h-5 rounded border-[#e4beb9] text-primary focus:ring-primary" />
                  <span className="font-bold text-[#5b403d] flex items-center gap-1">🌶 Món cay</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.isVegetarian} onChange={e => setFormData({...formData, isVegetarian: e.target.checked})} className="w-5 h-5 rounded border-[#e4beb9] text-emerald-500 focus:ring-emerald-500" />
                  <span className="font-bold text-[#5b403d] flex items-center gap-1">🌿 Món chay</span>
                </label>
              </div>
              <div className="mt-6 border-t border-[#efecff] pt-6 bg-red-50/30 rounded-xl p-4 border border-red-100">
                 <h4 className="font-bold text-red-600 mb-4 flex items-center gap-2">🔥 Thiết lập Flash Sale (Tùy chọn)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                       <label className="ds-label mb-1 block">Giá Flash Sale (VNĐ)</label>
                       <input type="number" min="0" step="1000" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} placeholder="VD: 25000" className="ds-input" />
                    </div>
                    <div>
                       <label className="ds-label mb-1 block">Bắt đầu lúc</label>
                       <input type="datetime-local" value={formData.flashSaleStart} onChange={e => setFormData({...formData, flashSaleStart: e.target.value})} className="ds-input" />
                    </div>
                    <div>
                       <label className="ds-label mb-1 block">Kết thúc lúc</label>
                       <input type="datetime-local" value={formData.flashSaleEnd} onChange={e => setFormData({...formData, flashSaleEnd: e.target.value})} className="ds-input" />
                    </div>
                 </div>
              </div>
              <div className="mt-6 border-t border-[#efecff] pt-6">
                <OptionBuilder options={formData.options} onChange={(opts) => setFormData({ ...formData, options: opts })} />
              </div>
              <div className="pt-4 border-t border-[#efecff] flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setProductModalOpen(false)} className="px-6 py-3 font-bold text-[#5b403d] bg-[#efecff] hover:bg-[#e8e5ff] rounded-xl transition-all">
                  Hủy bỏ
                </button>
                <button type="submit" className="ds-gradient-cta px-6 py-3 text-sm">
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
