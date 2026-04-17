'use client';

import { useAuthStore } from '@/store/auth';
import { fetchSellerStats, SellerStats, fetchSellerAdvancedStats, SellerAdvancedStats } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function SellerDashboardPage() {
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [advancedStats, setAdvancedStats] = useState<SellerAdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      Promise.all([
        fetchSellerStats(token).then(setStats),
        fetchSellerAdvancedStats(token).then(setAdvancedStats)
      ])
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (!stats) return <p className="text-primary font-bold">Không thể tải dữ liệu</p>;

  const maxSold = Math.max(...stats.topProducts.map((p) => p.totalSold), 1);

  const STAT_CARDS = [
    { icon: '📦', label: 'Đơn hôm nay', value: stats.ordersToday, gradient: 'from-blue-500 to-indigo-600' },
    { icon: '💰', label: 'Doanh thu hôm nay', value: formatPrice(stats.revenueToday), gradient: 'from-emerald-500 to-teal-600' },
    { icon: '🍔', label: 'Sản phẩm đang bán', value: stats.totalProducts, gradient: 'from-violet-500 to-purple-600' },
    { icon: '⭐', label: 'Đánh giá TB', value: `${stats.averageRating.toFixed(1)}/5`, gradient: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="ds-heading text-3xl font-extrabold text-[#1a1a2e]">
          Xin chào, {user?.name} 👋
        </h2>
        <p className="text-[#5b403d] mt-1 text-sm">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CARDS.map((stat) => (
          <div key={stat.label} className="ds-stat-card">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-xl shadow-lg`}>
              {stat.icon}
            </div>
            <div>
              <p className="ds-label">{stat.label}</p>
              <p className="text-2xl font-bold text-[#1a1a2e] mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 ds-card p-6">
          <h3 className="ds-heading text-lg font-bold text-[#1a1a2e] mb-4">🏆 Sản phẩm bán chạy</h3>
          <div className="space-y-4">
            {stats.topProducts.length === 0 ? (
              <p className="text-[#906f6c] text-sm text-center py-4">Chưa có dữ liệu</p>
            ) : (
              stats.topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#e4beb9] w-6">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1a2e] truncate">{product.name}</p>
                    <div className="mt-1.5 h-2 bg-[#efecff] rounded-full overflow-hidden">
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

        <div className="lg:col-span-3 ds-card p-6">
          <h3 className="ds-heading text-lg font-bold text-[#1a1a2e] mb-4">📈 Doanh thu 7 ngày</h3>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="sellerBarGrad" x1="0" y1="0" x2="0" y2="1">
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
                <Bar yAxisId="left" dataKey="revenue" name="Doanh thu (VNĐ)" fill="url(#sellerBarGrad)" radius={[6, 6, 0, 0]} barSize={24} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Số đơn" stroke="#ab3500" strokeWidth={3} dot={{ r: 4, fill: '#ab3500' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {advancedStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          {/* Top Customers */}
          <div className="ds-card p-6">
            <h3 className="ds-heading text-lg font-bold text-[#1a1a2e] mb-4">👑 Khách hàng thân thiết</h3>
            <div className="space-y-4">
              {advancedStats.topCustomers.length === 0 ? (
                <p className="text-[#906f6c] text-sm text-center py-4">Chưa có dữ liệu</p>
              ) : (
                advancedStats.topCustomers.map((cust, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#f5f2ff] flex items-center justify-center font-black text-primary">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1a1a2e] truncate">{cust.name || 'Khách vãng lai'}</p>
                      <p className="text-xs text-[#5b403d] truncate">{cust.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{formatPrice(cust.totalSpent)}</p>
                      <p className="text-xs text-[#906f6c]">{cust.totalOrders} đơn</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="ds-card p-6">
            <h3 className="ds-heading text-lg font-bold text-[#1a1a2e] mb-4">🎯 Tỷ lệ giao thành công</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-48 h-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Thành công', value: advancedStats.conversion.delivered },
                        { name: 'Đang xử lý', value: advancedStats.conversion.pending },
                        { name: 'Đã hủy', value: advancedStats.conversion.cancelled },
                      ]}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 30px rgba(26,26,46,0.12)', fontFamily: 'Inter' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold text-gray-700">Thành công</span>
                  </div>
                  <span className="font-bold text-gray-900">{advancedStats.conversion.delivered} đơn</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm font-semibold text-gray-700">Đang xử lý</span>
                  </div>
                  <span className="font-bold text-gray-900">{advancedStats.conversion.pending} đơn</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm font-semibold text-gray-700">Đã hủy</span>
                  </div>
                  <span className="font-bold text-gray-900">{advancedStats.conversion.cancelled} đơn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Period Comparison */}
          <div className="ds-card p-6">
            <h3 className="ds-heading text-lg font-bold text-[#1a1a2e] mb-4">⚖️ So sánh với kỳ trước</h3>
            <div className="space-y-6">
              {[
                { title: '7 Ngày Qua (so với tuần trước)', data: advancedStats.comparison.weekly.change, current: advancedStats.comparison.weekly.thisWeek },
                { title: '30 Ngày Qua (so với tháng trước)', data: advancedStats.comparison.monthly.change, current: advancedStats.comparison.monthly.thisMonth },
              ].map((period, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">{period.title}</p>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-white rounded-xl py-3 px-4 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Doanh thu</p>
                      <p className="font-bold text-gray-900">{formatPrice(period.current.revenue)}</p>
                      <div className={`mt-1 text-xs font-bold flex items-center gap-1 ${period.data.revenue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {period.data.revenue >= 0 ? '▲' : '▼'} {Math.abs(period.data.revenue).toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl py-3 px-4 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Đơn hàng</p>
                      <p className="font-bold text-gray-900">{period.current.orders} đơn</p>
                      <div className={`mt-1 text-xs font-bold flex items-center gap-1 ${period.data.orders >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {period.data.orders >= 0 ? '▲' : '▼'} {Math.abs(period.data.orders).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <div className="ds-card p-6">
            <h3 className="ds-heading text-lg font-bold text-[#1a1a2e] mb-4">🔥 Giờ cao điểm (7 ngày qua)</h3>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mt-4">
              {advancedStats.heatmap.map((h) => {
                let opacity = 0.05;
                if (h.count > 0) opacity = Math.min(1, 0.2 + (h.count * 0.15));
                return (
                  <div key={h.hour} className="group relative flex flex-col items-center gap-1">
                    <div 
                      className="w-full aspect-square rounded-md transition-all duration-300 group-hover:ring-2 ring-primary/50"
                      style={{ backgroundColor: `rgba(183, 19, 26, ${opacity})` }}
                    />
                    <span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-900">{h.hour}h</span>
                    
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {h.count} đơn
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
