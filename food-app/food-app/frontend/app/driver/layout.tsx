'use client';
import { useAuthStore } from '@/store/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { fetchDriverProfile, toggleDriverOnline, DriverProfile } from '@/lib/api/client';

const NAV_ITEMS = [
  { href: '/driver', label: 'Dashboard', icon: '🏠' },
  { href: '/driver/orders', label: 'Đơn mới', icon: '🔔' },
  { href: '/driver/my-orders', label: 'Lịch sử', icon: '📋' },
  { href: '/driver/earnings', label: 'Thu nhập', icon: '💰' },
  { href: '/driver/settings', label: 'Tài khoản', icon: '⚙️' },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'DRIVER') {
      router.push('/');
      return;
    }
    if (token) {
      fetchDriverProfile(token).then(setProfile).catch(() => {});
    }
  }, [user, token, router]);

  const handleToggleOnline = async () => {
    if (!token || toggling) return;
    setToggling(true);
    try {
      const updated = await toggleDriverOnline(token);
      setProfile(updated);
    } catch {}
    setToggling(false);
  };

  if (!user || user.role !== 'DRIVER') return null;

  const isOnline = profile?.isOnline ?? false;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-72 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>⭐ {profile?.averageRating?.toFixed(1) || '5.0'}</span>
                <span>·</span>
                <span>{profile?.totalDeliveries || 0} đơn</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleOnline}
            disabled={toggling}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isOnline
                ? 'bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30'
                : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
            {isOnline ? 'Đang Online' : 'Offline — Bật để nhận đơn'}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <LogoutButton className="w-full px-4 py-2.5 text-center rounded-xl bg-white/5 text-sm font-semibold text-gray-400 hover:bg-white/10 hover:text-white transition-colors" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
