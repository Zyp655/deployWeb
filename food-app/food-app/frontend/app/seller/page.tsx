'use client';

import { useAuthStore } from '@/store/auth';
import { fetchSellerStats, SellerStats } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function SellerDashboardPage() {
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchSellerStats(token)
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return <p className="text-red-500">Không thể tải dữ liệu</p>;

  const maxRevenue = Math.max(...stats.chartData.map((d) => d.revenue), 1);
  const maxSold = Math.max(...stats.topProducts.map((p) => p.totalSold), 1);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-extrabold text-gray-900">
          Xin chào, {user?.name} 👋
        </h2>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: '📦', label: 'Đơn hàng hôm nay', value: stats.ordersToday, color: 'blue' },
          { icon: '💰', label: 'Doanh thu hôm nay', value: formatPrice(stats.revenueToday), color: 'green' },
          { icon: '🍔', label: 'Sản phẩm đang bán', value: stats.totalProducts, color: 'purple' },
          { icon: '⭐', label: 'Đánh giá trung bình', value: `${stats.averageRating.toFixed(1)}/5`, color: 'amber' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
            <div className={`h-12 w-12 rounded-full bg-${stat.color}-100 text-${stat.color}-600 flex items-center justify-center text-xl`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Sản phẩm bán chạy</h3>
          <div className="space-y-3">
            {stats.topProducts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Chưa có dữ liệu</p>
            ) : (
              stats.topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-6">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                        style={{ width: `${(product.totalSold / maxSold) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary">{product.totalSold} đơn</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Doanh thu 7 ngày</h3>
          <div className="h-64 w-full mt-4">
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
                <Bar yAxisId="left" dataKey="revenue" name="Doanh thu (VNĐ)" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Số đơn hàng" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
