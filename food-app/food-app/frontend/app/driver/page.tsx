'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import {
  fetchDriverProfile,
  fetchTodayEarnings,
  fetchActiveDelivery,
  fetchAvailableOrders,
  registerDriver,
  DriverProfile,
  DriverTodayEarnings,
  DriverOrder,
} from '@/lib/api/client';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function DriverDashboard() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [earnings, setEarnings] = useState<DriverTodayEarnings | null>(null);
  const [activeOrder, setActiveOrder] = useState<DriverOrder | null>(null);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ vehicleType: 'MOTORBIKE', vehiclePlate: '', idCardNumber: '' });
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || user?.role !== 'DRIVER') return;
    loadData();

    const socket = io(WS_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('order-prepared', () => {
      fetchAvailableOrders(token).then(orders => setAvailableCount(orders.length)).catch(() => {});
    });

    socket.on('order-auto-assigned', () => {
      loadData();
    });

    return () => { socket.disconnect(); };
  }, [token, user]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const p = await fetchDriverProfile(token);
      setProfile(p);
      const [e, active, available] = await Promise.all([
        fetchTodayEarnings(token),
        fetchActiveDelivery(token),
        fetchAvailableOrders(token),
      ]);
      setEarnings(e);
      setActiveOrder(active);
      setAvailableCount(available.length);
    } catch {
      setShowRegister(true);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!token) return;
    try {
      const p = await registerDriver(regForm, token);
      setProfile(p);
      setShowRegister(false);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Lỗi đăng ký');
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  if (!user || user.role !== 'DRIVER') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showRegister) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="ds-card p-8 max-w-md w-full space-y-6">
          <div className="text-center">
            <span className="text-5xl">🛵</span>
            <h1 className="ds-heading text-2xl font-bold mt-3 text-[#1a1a2e]">Đăng ký Tài Xế</h1>
            <p className="text-[#906f6c] text-sm mt-1">Điền thông tin để bắt đầu nhận đơn</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="ds-label mb-1 block">Loại xe</label>
              <select value={regForm.vehicleType} onChange={(e) => setRegForm({ ...regForm, vehicleType: e.target.value })} className="ds-input">
                <option value="MOTORBIKE">Xe máy</option>
                <option value="BICYCLE">Xe đạp</option>
              </select>
            </div>
            <div>
              <label className="ds-label mb-1 block">Biển số xe</label>
              <input type="text" placeholder="VD: 59H1-12345" value={regForm.vehiclePlate} onChange={(e) => setRegForm({ ...regForm, vehiclePlate: e.target.value })} className="ds-input" />
            </div>
            <div>
              <label className="ds-label mb-1 block">Số CMND/CCCD</label>
              <input type="text" placeholder="Nhập CMND/CCCD" value={regForm.idCardNumber} onChange={(e) => setRegForm({ ...regForm, idCardNumber: e.target.value })} className="ds-input" />
            </div>
          </div>
          <button onClick={handleRegister} className="w-full ds-gradient-cta py-3.5 text-sm">
            Đăng ký ngay
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Đơn hôm nay', value: earnings?.totalOrders || 0, icon: '📦', gradient: 'from-blue-500 to-indigo-600' },
    { label: 'Thu nhập', value: `${fmt(earnings?.total || 0)}đ`, icon: '💰', gradient: 'from-emerald-500 to-teal-600' },
    { label: 'TB/Đơn', value: `${fmt(earnings?.avgPerOrder || 0)}đ`, icon: '📊', gradient: 'from-violet-500 to-purple-600' },
    { label: 'Rating', value: profile?.averageRating?.toFixed(1) || '5.0', icon: '⭐', gradient: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ds-heading text-2xl font-bold text-[#1a1a2e]">Dashboard</h1>
          <p className="text-[#5b403d] text-sm mt-0.5">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {earnings?.isPeakHour && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-accent/10 to-primary/10 text-accent px-4 py-2 rounded-full border border-accent/20">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold">Giờ cao điểm — Bonus +20%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="ds-stat-card flex-col items-start">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-lg shadow-lg mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-[#1a1a2e]">{s.value}</p>
            <p className="ds-label mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {activeOrder && (
        <div
          onClick={() => router.push(`/driver/delivery/${activeOrder.id}`)}
          className="bg-gradient-to-r from-primary to-primary-600 rounded-2xl p-6 text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-sm font-bold opacity-90">
                  {activeOrder.status === 'PICKING_UP' ? 'Đang lấy hàng' : 'Đang giao'}
                </span>
              </div>
              <h3 className="text-xl font-bold">{activeOrder.store?.name}</h3>
              <p className="text-white/70 text-sm mt-1">{activeOrder.deliveryAddress}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{fmt(activeOrder.shippingFee)}đ</p>
              <p className="text-white/60 text-xs">phí ship</p>
              <span className="inline-block mt-2 text-sm font-semibold bg-white/20 px-3 py-1 rounded-full group-hover:bg-white/30 transition-colors">
                Xem chi tiết →
              </span>
            </div>
          </div>
        </div>
      )}

      {!activeOrder && profile?.isOnline && (
        <div
          onClick={() => router.push('/driver/orders')}
          className="ds-card p-6 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_4px_50px_rgba(26,26,46,0.1)] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl">
                🔔
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1a1a2e]">{availableCount} đơn mới quanh bạn</h3>
                <p className="text-[#906f6c] text-sm">Bấm để xem và nhận đơn</p>
              </div>
            </div>
            <span className="text-accent font-bold group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      )}

      {!activeOrder && !profile?.isOnline && (
        <div className="ds-card p-8 text-center">
          <span className="text-5xl block mb-3">😴</span>
          <h3 className="ds-heading text-lg font-bold text-[#1a1a2e]">Bạn đang Offline</h3>
          <p className="text-[#906f6c] text-sm mt-1">Bật trạng thái Online ở sidebar để bắt đầu nhận đơn</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="ds-card p-5">
          <h3 className="font-bold text-[#1a1a2e] mb-2">Tỷ lệ hoàn thành</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-emerald-600">{profile?.acceptanceRate?.toFixed(0) || 100}%</span>
          </div>
          <div className="mt-3 h-2 bg-[#efecff] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
              style={{ width: `${profile?.acceptanceRate || 100}%` }}
            />
          </div>
        </div>
        <div className="ds-card p-5">
          <h3 className="font-bold text-[#1a1a2e] mb-2">Tổng thu nhập</h3>
          <p className="text-3xl font-bold text-[#1a1a2e]">{fmt(profile?.totalEarnings || 0)}đ</p>
          <p className="ds-label mt-1">{profile?.totalDeliveries || 0} đơn hoàn thành</p>
        </div>
      </div>
    </div>
  );
}
