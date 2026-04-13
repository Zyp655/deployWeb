'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth';

export default function PromotionsPage() {
  const { token } = useAuthStore();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'FIXED',
    discountValue: '',
    minOrderValue: '',
    usageLimit: '100',
    expiresAt: ''
  });

  const fetchCoupons = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${api.baseUrl}/coupons/seller`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!token) return;
      const res = await fetch(`${api.baseUrl}/coupons/seller`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Tạo khuyến mãi thành công!');
        fetchCoupons();
        setIsCreating(false);
        setFormData({ code: '', description: '', discountType: 'FIXED', discountValue: '', minOrderValue: '', usageLimit: '100', expiresAt: '' });
      } else {
        const err = await res.json();
        alert(`Lỗi: ${err.message}`);
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('Đã xảy ra lỗi khi tạo mã!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
      if (!token) return;
      const res = await fetch(`${api.baseUrl}/coupons/seller/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCoupons();
      } else {
        alert('Có lỗi xảy ra khi xóa mã!');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="ds-heading text-3xl font-extrabold text-[#1a1a2e]">🏷️ Quản lý Khuyến Mãi</h2>
          <p className="text-[#5b403d] mt-1 text-sm">Tạo và quản lý các mã giảm giá cho quán của bạn</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={isCreating ? 'rounded-xl bg-[#efecff] px-5 py-2.5 font-bold text-[#5b403d] transition-all' : 'ds-gradient-cta px-5 py-2.5'}
        >
          {isCreating ? 'Hủy' : '+ Tạo mã mới'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="ds-card p-6 space-y-4">
          <h3 className="ds-heading text-xl font-bold text-[#1a1a2e] border-b border-[#efecff] pb-3">Thông tin mã giảm giá</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="ds-label mb-1 block">Mã Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="ds-input uppercase"
                placeholder="PROMOCODE"
              />
            </div>
            <div>
              <label className="ds-label mb-1 block">Loại giảm giá</label>
              <select
                value={formData.discountType}
                onChange={e => setFormData({...formData, discountType: e.target.value})}
                className="ds-input"
              >
                <option value="FIXED">Giảm tiền trực tiếp (VNĐ)</option>
                <option value="PERCENT">Giảm theo %</option>
              </select>
            </div>
            <div>
              <label className="ds-label mb-1 block">Mức giảm *</label>
              <input
                type="number"
                required
                value={formData.discountValue}
                onChange={e => setFormData({...formData, discountValue: e.target.value})}
                className="ds-input"
                placeholder={formData.discountType === 'FIXED' ? 'VD: 15000' : 'VD: 10'}
              />
            </div>
            <div>
              <label className="ds-label mb-1 block">Đơn tối thiểu</label>
              <input
                type="number"
                value={formData.minOrderValue}
                onChange={e => setFormData({...formData, minOrderValue: e.target.value})}
                className="ds-input"
                placeholder="VD: 50000"
              />
            </div>
            <div>
              <label className="ds-label mb-1 block">Giới hạn lượt</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                className="ds-input"
                placeholder="Mặc định: 100"
              />
            </div>
            <div>
              <label className="ds-label mb-1 block">Hết hạn</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={e => setFormData({...formData, expiresAt: e.target.value})}
                className="ds-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="ds-label mb-1 block">Mô tả</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="ds-input"
                placeholder="VD: Giảm 15k cho đơn từ 50k"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="ds-gradient-cta px-6 py-2.5 text-sm">Xác nhận Tạo</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-[#906f6c]">Đang tải khuyến mãi...</div>
      ) : coupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map(coupon => (
            <div key={coupon.id} className="ds-card p-5 relative group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_50px_rgba(26,26,46,0.1)]">
               <div className="absolute top-0 right-0 bg-gradient-to-br from-primary to-primary-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                 Hoạt động
               </div>
               <div className="mb-4">
                  <h3 className="text-xl font-bold uppercase text-[#1a1a2e] border-2 border-dashed border-primary/30 inline-block px-3 py-1 rounded-lg bg-primary/5">{coupon.code}</h3>
               </div>
               <p className="text-[#5b403d] mb-4 text-sm">{coupon.description || 'Không có mô tả'}</p>
               <div className="space-y-2 text-sm text-[#906f6c] mb-6">
                 <div className="flex justify-between">
                   <span>Mức giảm:</span>
                   <span className="font-semibold text-[#1a1a2e]">
                     {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}đ`}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span>Đơn tối thiểu:</span>
                   <span className="font-semibold text-[#1a1a2e]">{coupon.minOrderValue.toLocaleString()}đ</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Đã dùng:</span>
                   <span className="font-semibold text-[#1a1a2e]">{coupon.usedCount} / {coupon.usageLimit}</span>
                 </div>
                 {coupon.expiresAt && (
                   <div className="flex justify-between">
                     <span>Hết hạn:</span>
                     <span className="font-semibold text-primary">{new Date(coupon.expiresAt).toLocaleDateString('vi-VN')}</span>
                   </div>
                 )}
               </div>
               <div className="pt-4 border-t border-[#efecff] flex justify-end">
                 <button onClick={() => handleDelete(coupon.id)} className="text-primary hover:text-primary-700 font-semibold text-sm transition-all opacity-0 group-hover:opacity-100">
                   Xóa mã này
                 </button>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ds-card p-12 text-center">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="ds-heading text-xl font-bold text-[#1a1a2e] mb-2">Chưa có Khuyến mãi nào</h3>
          <p className="text-[#906f6c]">Hãy tạo mã giảm giá đầu tiên để thu hút khách hàng nhé!</p>
        </div>
      )}
    </div>
  );
}
