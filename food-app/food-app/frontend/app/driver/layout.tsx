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
  { href: '/driver/wallet', label: 'Ví của tôi', icon: '💳' },
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
    <div className="flex min-h-screen">
      <div className="w-72 ds-sidebar flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold shadow-lg">
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
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
            {isOnline ? 'Đang Online' : 'Offline — Bật để nhận đơn'}
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`ds-nav-item ${isActive ? 'bg-accent/15 text-accent border border-accent/20' : ''}`}
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

      <div className="flex-1 overflow-auto ds-page-bg">{children}</div>
    </div>
  );
}
