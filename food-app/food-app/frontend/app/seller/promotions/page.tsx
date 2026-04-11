'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';

export default function PromotionsPage() {
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
      const token = localStorage.getItem('token');
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
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
        setFormData({
            code: '',
            description: '',
            discountType: 'FIXED', 
            discountValue: '',
            minOrderValue: '',
            usageLimit: '100',
            expiresAt: ''
        });
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
      const token = localStorage.getItem('token');
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
          <h2 className="text-3xl font-bold text-gray-900">Quản lý Khuyến Mãi</h2>
          <p className="text-gray-500 mt-1">Tạo và quản lý các mã giảm giá cho quán của bạn</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-primary hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all active:scale-95"
        >
          {isCreating ? 'Hủy' : '+ Tạo mã mới'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-3 border-gray-100">Thông tin mã giảm giá</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã Code (VD: GIAM15K) *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                placeholder="PROMOCODE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
              <select
                value={formData.discountType}
                onChange={e => setFormData({...formData, discountType: e.target.value})}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="FIXED">Giảm tiền trực tiếp (VNĐ)</option>
                <option value="PERCENT">Giảm theo %</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mức giảm *</label>
              <input
                type="number"
                required
                value={formData.discountValue}
                onChange={e => setFormData({...formData, discountValue: e.target.value})}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder={formData.discountType === 'FIXED' ? 'VD: 15000' : 'VD: 10'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu áp dụng</label>
              <input
                type="number"
                value={formData.minOrderValue}
                onChange={e => setFormData({...formData, minOrderValue: e.target.value})}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="VD: 50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn lượt dùng</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Mặc định: 100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn (Tuỳ chọn)</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={e => setFormData({...formData, expiresAt: e.target.value})}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (Ngắn gọn)</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="VD: Giảm 15k cho đơn từ 50k"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-600 transition-colors">
              Xác nhận Tạo
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải khuyến mãi...</div>
      ) : coupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map(coupon => (
            <div key={coupon.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group overflow-hidden">
               <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                 Đang hoạt động
               </div>
               <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="text-xl font-bold uppercase text-gray-900 border-2 border-dashed border-primary/30 inline-block px-3 py-1 rounded-lg bg-primary/5">{coupon.code}</h3>
                 </div>
               </div>
               <p className="text-gray-600 mb-4">{coupon.description || 'Không có mô tả'}</p>
               <div className="space-y-2 text-sm text-gray-500 mb-6">
                 <div className="flex justify-between">
                   <span>Mức giảm:</span>
                   <span className="font-semibold text-gray-900">
                     {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}đ`}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span>Đơn tối thiểu:</span>
                   <span className="font-semibold text-gray-900">{coupon.minOrderValue.toLocaleString()}đ</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Đã dùng:</span>
                   <span className="font-semibold text-gray-900">{coupon.usedCount} / {coupon.usageLimit}</span>
                 </div>
                 {coupon.expiresAt && (
                   <div className="flex justify-between">
                     <span>Hết hạn:</span>
                     <span className="font-semibold text-red-500">{new Date(coupon.expiresAt).toLocaleDateString('vi-VN')}</span>
                   </div>
                 )}
               </div>
               <div className="pt-4 border-t border-gray-100 flex justify-end">
                 <button onClick={() => handleDelete(coupon.id)} className="text-red-500 hover:text-red-700 font-semibold text-sm transition-colors opacity-0 group-hover:opacity-100">
                   Xóa mã này
                 </button>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có Khuyến mãi nào</h3>
          <p className="text-gray-500">Hãy tạo mã giảm giá đầu tiên để thu hút khách hàng nhé!</p>
        </div>
      )}
    </div>
  );
}
