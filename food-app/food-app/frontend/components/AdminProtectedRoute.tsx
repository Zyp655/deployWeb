'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, token } = useAuthStore();
  const isAuthenticated = !!token;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated || !isAdmin) {
        router.replace('/menu');
      }
    }
  }, [isAdmin, isAuthenticated, router, mounted]);

  if (!mounted || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
