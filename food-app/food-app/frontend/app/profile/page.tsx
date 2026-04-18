'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  fetchProfile, updateProfile, changePassword, fetchMyOrders,
  UserProfile, Order,
} from '@/lib/api/client';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  PREPARING: { label: 'Đang chuẩn bị', color: 'bg-indigo-100 text-indigo-700' },
  DELIVERING: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

type Tab = 'profile' | 'password' | 'orders';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, openAuthModal } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      openAuthModal('login');
      return;
    }
    fetchProfile(token).then((p) => {
      setProfile(p);
      setName(p.name);
      setPhone(p.phone || '');
    });
  }, [user, token, openAuthModal]);

  useEffect(() => {
    if (activeTab === 'orders' && token) {
      setOrdersLoading(true);
      fetchMyOrders(token)
        .then(setOrders)
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileLoading(true);
    setProfileMsg('');
    try {
      await updateProfile({ name, phone }, token);
      setProfileMsg('✅ Cập nhật thành công!');
    } catch { setProfileMsg('❌ Có lỗi xảy ra'); }
    finally { setProfileLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPwError('');
    setPwMsg('');
    if (newPw !== confirmPw) { setPwError('Mật khẩu xác nhận không khớp'); return; }
    if (newPw.length < 6) { setPwError('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }

    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw, token);
      setPwMsg('✅ Đổi mật khẩu thành công!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally { setPwLoading(false); }
  };

  if (!user) return null;

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'profile', icon: '📋', label: 'Thông tin cá nhân' },
    { id: 'password', icon: '🔒', label: 'Đổi mật khẩu' },
    { id: 'orders', icon: '📦', label: 'Lịch sử đơn hàng' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-72 flex-shrink-0">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="mt-3 text-lg font-bold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                {user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'RESTAURANT' ? 'Người bán' : 'Khách hàng'}
              </span>
            </div>

            <nav className="mt-4 rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary border-l-4 border-primary'
                      : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 animate-fade-up">
                <h2 className="text-xl font-bold text-gray-900 mb-6">📋 Thông tin cá nhân</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Họ tên</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input value={profile?.email || ''} disabled className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0987654321" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                  {profileMsg && <p className={`text-sm font-medium ${profileMsg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{profileMsg}</p>}
                  <button type="submit" disabled={profileLoading} className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                    {profileLoading ? '⏳ Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 animate-fade-up">
                <h2 className="text-xl font-bold text-gray-900 mb-6">🔒 Đổi mật khẩu</h2>
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu hiện tại</label>
                    <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu mới</label>
                    <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                    <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                  {pwError && <p className="text-sm font-medium text-red-600">{pwError}</p>}
                  {pwMsg && <p className="text-sm font-medium text-green-600">{pwMsg}</p>}
                  <button type="submit" disabled={pwLoading} className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                    {pwLoading ? '⏳ Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 animate-fade-up">
                <h2 className="text-xl font-bold text-gray-900 mb-6">📦 Lịch sử đơn hàng</h2>
                {ordersLoading ? (
                  <div className="text-center py-10"><span className="text-4xl animate-bounce inline-block">📦</span><p className="mt-2 text-sm text-gray-500">Đang tải...</p></div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10"><span className="text-4xl">🛒</span><p className="mt-2 text-gray-500">Bạn chưa có đơn hàng nào</p></div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const st = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
                      return (
                        <div
                          key={order.id}
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="flex items-center justify-between rounded-xl bg-gray-50 p-4 cursor-pointer transition-all hover:bg-gray-100 hover:shadow-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">#{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(order.createdAt).toLocaleDateString('vi-VN')} • {order.items.length} món
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.color}`}>{st.label}</span>
                            <span className="text-sm font-bold text-primary">{formatPrice(order.total)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
