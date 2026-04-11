'use client';

import { useAuthStore } from '@/store/auth';
import { fetchSellerStore, updateSellerStore, toggleSellerStore, Store } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function SellerStorePage() {
  const { token } = useAuthStore();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Store>>({});
  const [searchAddress, setSearchAddress] = useState('');

  const loadData = () => {
    if (token) {
      fetchSellerStore(token)
        .then((data) => {
          setStore(data);
          setFormData(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleToggleStatus = async () => {
    if (!token || !store) return;
    try {
      const updated = await toggleSellerStore(token);
      setStore(updated);
      setFormData(updated);
    } catch (err) {
      alert('Không thể thay đổi trạng thái');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      const updated = await updateSellerStore(formData, token);
      setStore(updated);
      setIsEditing(false);
    } catch (err) {
      alert('Lỗi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleGeocode = async () => {
    if (!formData.address) return;
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOONG_API_KEY;
      if (!apiKey) {
        alert('Thiếu GOONG_API_KEY');
        return;
      }
      const res = await fetch(`https://rsapi.goong.io/geocode?address=${encodeURIComponent(formData.address)}&api_key=${apiKey}`);
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setFormData({ ...formData, lat: location.lat, lng: location.lng });
        alert('✅ Đã tìm thấy tọa độ tự động từ Goong Maps!');
      } else {
        alert('❌ Không tìm thấy tọa độ từ địa chỉ này, vui lòng ghim trên bản đồ.');
      }
    } catch (e) {
      alert('Lỗi khi gọi API Goong');
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData({ ...formData, lat, lng });
  };

  if (loading) {
    return <div className="h-64 bg-white rounded-2xl animate-pulse" />;
  }

  if (!store) {
    return <p className="text-red-500">Bạn chưa có cửa hàng!</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">🏪 Cửa hàng</h2>
          <p className="text-gray-500 mt-1">Quản lý thông tin và giờ hoạt động</p>
        </div>
        <button
          onClick={handleToggleStatus}
          className={`px-6 py-2 rounded-xl text-white font-bold transition-all ${
            store.isOpen
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30'
              : 'bg-gray-500 hover:bg-gray-600'
          }`}
        >
          {store.isOpen ? '🟢 Đang mở cửa' : '🔴 Đã tự đóng cửa'}
        </button>
      </header>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        {/* Cover Graphic */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 to-accent/10" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900">{store.name}</h3>
            <p className="text-gray-500 mt-2 max-w-2xl">{store.description || 'Chưa có mô tả'}</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-primary font-bold hover:underline"
          >
            {isEditing ? 'Hủy' : '✏️ Chỉnh sửa'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên cửa hàng</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-primary focus:ring-primary outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-primary focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ & Vị trí</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 focus:border-primary focus:ring-primary outline-none transition-all"
                    placeholder="Nhập địa chỉ cửa hàng..."
                  />
                  <button type="button" onClick={handleGeocode} className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold whitespace-nowrap active:scale-95">
                    🔎 Tìm Tọa độ
                  </button>
                </div>
                <div className="mb-2 text-xs text-gray-500 flex justify-between">
                  <span>Hoặc ghim trực tiếp trên bản đồ bên dưới:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">Lat: {formData.lat?.toFixed(5) || '---'}, Lng: {formData.lng?.toFixed(5) || '---'}</span>
                </div>
                <MapPicker lat={formData.lat} lng={formData.lng} onLocationChange={handleLocationChange} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả tóm tắt</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-primary focus:ring-primary outline-none transition-all h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Giờ mở cửa</label>
                <input
                  type="time"
                  value={formData.openTime || ''}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-primary focus:ring-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Giờ đóng cửa</label>
                <input
                  type="time"
                  value={formData.closeTime || ''}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-primary focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-accent hover:brightness-110 shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div>
              <p className="text-sm text-gray-500 font-medium">Giờ hoạt động</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {store.openTime} - {store.closeTime}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Đánh giá trung bình</p>
              <p className="text-lg font-bold text-gray-900 mt-1 flex items-center gap-1">
                ⭐ {store.rating.toFixed(1)}/5
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 font-medium">Địa chỉ</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {store.address || 'Chưa cập nhật địa chỉ'}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 font-medium">Liên hệ hỗ trợ</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {store.phone || 'Chưa cập nhật SĐT'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
