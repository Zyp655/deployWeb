'use client';

import { useAuthStore } from '@/store/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RoleGuard() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user || !pathname) return;

    // Check if the current path is a dashboard path
    const isSellerPath = pathname.startsWith('/seller');
    const isDriverPath = pathname.startsWith('/driver');
    const isAdminPath = pathname.startsWith('/admin');

    // If the user has a special role, enforce they stay in their dashboard
    if (user.role === 'RESTAURANT' && !isSellerPath) {
      router.replace('/seller');
    } else if (user.role === 'DRIVER' && !isDriverPath) {
      router.replace('/driver');
    } else if (user.role === 'ADMIN' && !isAdminPath) {
      router.replace('/admin');
    }
    // CUSTOMER role or unrecognized roles can access any non-dashboard path freely, 
    // since their specific accesses to dashboards are protected by the dashboard layouts.
  }, [user, pathname, router]);

  return null;
}
