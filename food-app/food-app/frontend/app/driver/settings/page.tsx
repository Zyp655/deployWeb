'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import {
  fetchDriverProfile,
  updateDriverProfile,
  updateProfile,
  uploadImage,
  DriverProfile,
} from '@/lib/api/client';

export default function DriverSettingsPage() {
  const { user, token } = useAuthStore();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ vehicleType: '', vehiclePlate: '', idCardNumber: '' });
  const [userForm, setUserForm] = useState({ name: '', phone: '' });
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchDriverProfile(token)
      .then((p) => {
        setProfile(p);
        setForm({
          vehicleType: p.vehicleType || 'MOTORBIKE',
          vehiclePlate: p.vehiclePlate || '',
          idCardNumber: p.idCardNumber || '',
        });
        setUserForm({
          name: p.user?.name || '',
          phone: p.user?.phone || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSaveProfile = async () => {
    if (!token || saving) return;
    setSaving(true);
    try {
      await updateDriverProfile(form, token);
      await updateProfile(userForm, token);
      alert('Đã lưu thành công!');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setAvatarUploading(true);
    try {
      const { url } = await uploadImage(file, token);
      await updateProfile({ avatar: url } as any, token);
      setProfile((prev) => prev ? { ...prev, user: { ...prev.user!, avatar: url } } : prev);
    } catch {}
    setAvatarUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Tài khoản & Xe</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-4">Ảnh đại diện</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
              {profile?.user?.avatar ? (
                <img src={profile.user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50">
              📷
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <div>
            <p className="font-bold text-gray-900">{profile?.user?.name}</p>
            <p className="text-sm text-gray-500">{profile?.user?.email}</p>
            {avatarUploading && <p className="text-xs text-orange-500 mt-1">Đang tải lên...</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-bold text-gray-900">Thông tin cá nhân</h2>
        <div>
          <label className="text-sm font-semibold text-gray-700">Họ tên</label>
          <input
            type="text"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700">Số điện thoại</label>
          <input
            type="tel"
            value={userForm.phone}
            onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
            className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-bold text-gray-900">Thông tin xe</h2>
        <div>
          <label className="text-sm font-semibold text-gray-700">Loại xe</label>
          <select
            value={form.vehicleType}
            onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
            className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="MOTORBIKE">🏍️ Xe máy</option>
            <option value="BICYCLE">🚲 Xe đạp</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700">Biển số xe</label>
          <input
            type="text"
            value={form.vehiclePlate}
            onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
            className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700">Số CMND/CCCD</label>
          <input
            type="text"
            value={form.idCardNumber}
            onChange={(e) => setForm({ ...form, idCardNumber: e.target.value })}
            className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-3">Thống kê</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Tổng chuyến</p>
            <p className="text-xl font-bold text-gray-900">{profile?.totalDeliveries || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Rating</p>
            <p className="text-xl font-bold text-gray-900">⭐ {profile?.averageRating?.toFixed(1) || '5.0'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Tổng thu nhập</p>
            <p className="text-xl font-bold text-gray-900">{new Intl.NumberFormat('vi-VN').format(profile?.totalEarnings || 0)}đ</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Tỷ lệ nhận</p>
            <p className="text-xl font-bold text-gray-900">{profile?.acceptanceRate?.toFixed(0) || 100}%</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveProfile}
        disabled={saving}
        className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>
    </div>
  );
}
