'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { fetchAdminCoupons, createAdminCoupon, deleteAdminCoupon, CouponFull } from '@/lib/api/client';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function AdminCouponsPage() {
  const { token } = useAuthStore();
  const [coupons, setCoupons] = useState<CouponFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderValue: 0,
    maxDiscount: '',
    usageLimit: 100,
    expiresAt: '',
  });

  const loadCoupons = async () => {
    if (!token) return;
    try {
      const data = await fetchAdminCoupons(token);
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.code.trim()) return;
    setCreating(true);
    setError('');
    try {
      await createAdminCoupon({
        code: form.code,
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: Number(form.usageLimit) || 100,
        expiresAt: form.expiresAt || null,
      }, token);
      setShowForm(false);
      setForm({ code: '', description: '', discountType: 'PERCENT', discountValue: 10, minOrderValue: 0, maxDiscount: '', usageLimit: 100, expiresAt: '' });
      loadCoupons();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tạo coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Xóa mã giảm giá này?')) return;
    try {
      await deleteAdminCoupon(id, token);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert('Lỗi xóa coupon');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-gray-500 py-10">Đang tải danh sách mã giảm giá...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Quản lý Mã giảm giá</h2>
          <p className="text-gray-500 mt-1">Tạo và quản lý coupon toàn hệ thống</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 active:scale-95"
        >
          {showForm ? '✕ Đóng' : '+ Tạo mã mới'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Tạo Mã Giảm Giá Mới</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mã code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="VD: FREESHIP50"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-mono font-bold uppercase focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="VD: Giảm 50% cho đơn đầu tiên"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loại giảm giá</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định (₫)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Giá trị giảm {form.discountType === 'PERCENT' ? '(%)' : '(₫)'}
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                min={1}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Đơn tối thiểu (₫)</label>
              <input
                type="number"
                value={form.minOrderValue}
                onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                min={0}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Giảm tối đa (₫)</label>
              <input
                type="number"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                placeholder="Không giới hạn"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Giới hạn lượt dùng</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                min={1}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Hết hạn</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-gray-800 disabled:opacity-50"
            >
              {creating ? '⏳ Đang tạo...' : 'Tạo mã giảm giá'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
              <th className="px-6 py-4">Mã</th>
              <th className="px-6 py-4">Loại</th>
              <th className="px-6 py-4">Giá trị</th>
              <th className="px-6 py-4">Đơn tối thiểu</th>
              <th className="px-6 py-4">Lượt dùng</th>
              <th className="px-6 py-4">Hết hạn</th>
              <th className="px-6 py-4">Phạm vi</th>
              <th className="px-6 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.map((c) => {
              const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
              const isMaxed = c.usedCount >= c.usageLimit;
              return (
                <tr key={c.id} className={`hover:bg-gray-50/50 transition-colors ${isExpired || isMaxed || !c.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-primary bg-primary-50 px-2 py-1 rounded-lg text-sm">{c.code}</span>
                    {c.description && <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{c.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${c.discountType === 'PERCENT' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                      {c.discountType === 'PERCENT' ? 'Phần trăm' : 'Cố định'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {c.discountType === 'PERCENT' ? `${c.discountValue}%` : formatPrice(c.discountValue)}
                    {c.maxDiscount && <span className="block text-xs text-gray-400 font-normal">Tối đa {formatPrice(c.maxDiscount)}</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {c.minOrderValue > 0 ? formatPrice(c.minOrderValue) : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`font-bold ${isMaxed ? 'text-red-500' : 'text-gray-900'}`}>{c.usedCount}</span>
                    <span className="text-gray-400">/{c.usageLimit}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {c.expiresAt ? (
                      <span className={isExpired ? 'text-red-500 font-semibold' : 'text-gray-600'}>
                        {new Date(c.expiresAt).toLocaleDateString('vi-VN')}
                        {isExpired && <span className="block text-[10px]">Đã hết hạn</span>}
                      </span>
                    ) : (
                      <span className="text-gray-400">Không giới hạn</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {c.storeId ? (
                      <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold">Theo quán</span>
                    ) : (
                      <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg text-xs font-bold">Toàn hệ thống</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-500 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                  Chưa có mã giảm giá nào. Tạo mã đầu tiên!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
