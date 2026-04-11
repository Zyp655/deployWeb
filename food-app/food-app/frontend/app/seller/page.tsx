'use client';

import { useAuthStore } from '@/store/auth';
import { fetchSellerStats, SellerStats } from '@/lib/api/client';
import { useEffect, useState } from 'react';

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
          <div className="flex items-end space-x-2 h-48 mt-4">
            {stats.chartData.map((data, idx) => {
              const height = (data.revenue / maxRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end relative group">
                  <div className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                    {new Intl.NumberFormat('vi-VN').format(data.revenue)} đ
                  </div>
                  <div
                    className="w-full max-w-[3rem] bg-gradient-to-t from-primary/80 to-accent/80 rounded-t-lg transition-all duration-500 hover:brightness-110"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[10px] text-gray-500 mt-2">{data.date}</span>
                  <span className="text-[10px] font-bold text-gray-700">{data.orders} đơn</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
