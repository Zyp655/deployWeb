'use client';

import { useAuthStore } from '@/store/auth';
import { fetchAdminStats, AdminStats } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const ICON_CARDS = [
  { icon: '📦', label: 'Tổng đơn hàng', key: 'totalOrders', gradient: 'from-blue-500 to-indigo-600' },
  { icon: '💰', label: 'Doanh thu hôm nay', key: 'revenueToday', gradient: 'from-emerald-500 to-teal-600', isCurrency: true },
  { icon: '👥', label: 'Tổng người dùng', key: 'totalUsers', gradient: 'from-violet-500 to-purple-600' },
  { icon: '🍔', label: 'Tổng sản phẩm', key: 'totalProducts', gradient: 'from-amber-500 to-orange-600' },
];

export default function AdminDashboardPage() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchAdminStats(token)
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-[#efecff] rounded-xl w-48 animate-pulse" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-80 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!stats) return <p className="text-primary font-bold">Không thể tải dữ liệu thống kê</p>;

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="ds-heading text-3xl font-extrabold text-[#1a1a2e]">Tổng quan</h2>
        <p className="text-[#5b403d] mt-1 text-sm">Số liệu hoạt động hệ thống HOANG FOOD</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ICON_CARDS.map((card) => {
          const val = (stats as any)[card.key];
          return (
            <div key={card.key} className="ds-stat-card">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-xl shadow-lg`}>
                {card.icon}
              </div>
              <div>
                <p className="ds-label">{card.label}</p>
                <p className="text-2xl font-bold text-[#1a1a2e] mt-0.5">
                  {card.isCurrency ? fmt(val) : val.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ds-card p-6">
        <h3 className="ds-heading text-lg font-bold text-[#1a1a2e] mb-6">📈 Xu hướng doanh thu (7 ngày)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stats.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b7131a" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#db322f" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4beb9" strokeOpacity={0.4} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5b403d' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5b403d' }} tickFormatter={(v) => `${v >= 1000 ? (v / 1000) + 'k' : v}`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5b403d' }} />
              <Tooltip cursor={{ fill: '#f5f2ff' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 30px rgba(26,26,46,0.12)', fontFamily: 'Inter' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontFamily: 'Inter', fontSize: '13px' }} />
              <Bar yAxisId="left" dataKey="revenue" name="Doanh thu (VNĐ)" fill="url(#barGrad)" radius={[6, 6, 0, 0]} barSize={32} />
              <Line yAxisId="right" type="monotone" dataKey="orders" name="Số đơn" stroke="#ab3500" strokeWidth={3} dot={{ r: 4, fill: '#ab3500' }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
