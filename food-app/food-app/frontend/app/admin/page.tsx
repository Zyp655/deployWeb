'use client';

import { useAuthStore } from '@/store/auth';
import { fetchAdminStats, AdminStats } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

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
    return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-gray-200 rounded"></div><div className="h-4 bg-gray-200 rounded w-5/6"></div></div></div></div>;
  }

  if (!stats) return <p className="text-red-500">Failed to load statistics</p>;

  // calculate max revenue for bar heights
  const maxRevenue = Math.max(...stats.chartData.map((d) => d.revenue), 1);

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">Tổng quan</h2>
        <p className="text-gray-500 mt-1">Số liệu hoạt động của hệ thống HOANG FOOD</p>
      </header>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center shadow-lg shadow-blue-500/5">
          <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">📦</div>
          <div className="ml-4">
            <p className="text-sm font-semibold text-gray-500">Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center shadow-lg shadow-green-500/5">
          <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">💰</div>
          <div className="ml-4">
            <p className="text-sm font-semibold text-gray-500">Doanh thu hôm nay</p>
            <p className="text-2xl font-bold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenueToday)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center shadow-lg shadow-purple-500/5">
          <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl">👥</div>
          <div className="ml-4">
            <p className="text-sm font-semibold text-gray-500">Tổng User</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center shadow-lg shadow-orange-500/5">
          <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl">🍔</div>
          <div className="ml-4">
            <p className="text-sm font-semibold text-gray-500">Tổng món ăn</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Doanh thu 7 ngày gần đây</h3>
        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stats.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }} 
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => `${value >= 1000 ? (value / 1000) + 'k' : value}`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar yAxisId="left" dataKey="revenue" name="Doanh thu (VNĐ)" fill="#f97316" radius={[4, 4, 0, 0]} barSize={32} />
              <Line yAxisId="right" type="monotone" dataKey="orders" name="Số đơn hàng" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
