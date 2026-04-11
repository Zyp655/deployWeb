'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

export default function LogoutButton({ className }: { className?: string }) {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <button onClick={handleLogout} className={className}>
      🚪 Đăng xuất
    </button>
  );
}
