'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SellerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token, openAuthModal } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || !token) {
      openAuthModal('login');
      return;
    }
    if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, token, router, openAuthModal]);

  if (!user || !token || (user.role !== 'RESTAURANT' && user.role !== 'ADMIN')) {
    return null;
  }

  return <>{children}</>;
}
