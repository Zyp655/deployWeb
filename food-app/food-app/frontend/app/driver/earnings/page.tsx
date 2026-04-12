'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import {
  fetchTodayEarnings,
  fetchEarningsSummary,
  DriverTodayEarnings,
  DriverEarningsSummary,
} from '@/lib/api/client';

export default function DriverEarningsPage() {
  const { token } = useAuthStore();
  const [today, setToday] = useState<DriverTodayEarnings | null>(null);
  const [summary, setSummary] = useState<DriverEarningsSummary | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, days]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        fetchTodayEarnings(token),
        fetchEarningsSummary(token, days),
      ]);
      setToday(t);
      setSummary(s);
    } catch {}
    setLoading(false);
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxChartValue = summary?.chartData ? Math.max(...summary.chartData.map(d => d.total), 1) : 1;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Thu nhập</h1>

      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
        <p className="text-sm font-semibold opacity-80">Thu nhập hôm nay</p>
        <p className="text-4xl font-bold mt-2">{fmt(today?.total || 0)}đ</p>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-xs opacity-70">Phí giao</p>
            <p className="font-bold text-lg">{fmt(today?.totalBaseFee || 0)}đ</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Tip khách</p>
            <p className="font-bold text-lg">{fmt(today?.totalTip || 0)}đ</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Bonus</p>
            <p className="font-bold text-lg">{fmt(today?.totalBonus || 0)}đ</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
          <span className="text-sm opacity-80">{today?.totalOrders || 0} đơn · TB {fmt(today?.avgPerOrder || 0)}đ/đơn</span>
          {today?.isPeakHour && (
            <span className="bg-white/20 text-xs font-bold px-3 py-1 rounded-full">🔥 Peak Hour</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-gray-900">Biểu đồ thu nhập</h2>
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  days === d
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {d} ngày
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2 h-48">
          {summary?.chartData?.map((item, i) => {
            const height = maxChartValue > 0 ? (item.total / maxChartValue) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500 font-semibold">
                  {item.total > 0 ? `${fmt(Math.round(item.total / 1000))}k` : ''}
                </span>
                <div className="w-full relative" style={{ height: `${Math.max(height, 4)}%` }}>
                  <div
                    className={`absolute inset-0 rounded-t-lg transition-all ${
                      item.total > 0
                        ? 'bg-gradient-to-t from-orange-500 to-orange-400'
                        : 'bg-gray-100'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{item.date}</span>
                <span className="text-[10px] text-gray-400">{item.orders}đ</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-semibold">Tổng {days} ngày</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(summary?.totalEarnings || 0)}đ</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-semibold">Tổng đơn</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-semibold">Rating</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">⭐ {summary?.averageRating?.toFixed(1) || '5.0'}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-semibold">Tỷ lệ nhận</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.acceptanceRate?.toFixed(0) || 100}%</p>
        </div>
      </div>
    </div>
  );
}
