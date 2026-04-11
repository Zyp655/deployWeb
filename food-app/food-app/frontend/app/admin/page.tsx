'use client';

import { useAuthStore } from '@/store/auth';
import { fetchAdminStats, AdminStats } from '@/lib/api/client';
import { useEffect, useState } from 'react';

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
        <p className="text-gray-500 mt-1">Số liệu hoạt động của hệ thống Food App</p>
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
        <div className="flex items-end space-x-2 sm:space-x-4 h-64 mt-4 relative pt-6">
          {/* Simple CSS Bar Chart without external dependencies */}
          {stats.chartData.map((data, idx) => {
            const height = (data.revenue / maxRevenue) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end relative group">
                {/* Tooltip */}
                <div className="absolute -top-10 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                  {new Intl.NumberFormat('vi-VN').format(data.revenue)} đ
                </div>
                
                <div 
                  className="w-full max-w-[4rem] bg-gradient-to-t from-primary/80 to-accent/80 rounded-t-lg transition-all duration-500 hover:brightness-110"
                  style={{ height: `${Math.max(height, 2)}%` }}
                ></div>
                <span className="text-[10px] sm:text-xs text-gray-500 mt-2 font-mono">{data.date}</span>
                <span className="text-[10px] sm:text-xs font-bold text-gray-700 mt-1">{data.orders} đơn</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
