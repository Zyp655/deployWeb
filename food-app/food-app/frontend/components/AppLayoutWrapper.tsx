'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import RealtimeNotifications from '@/components/RealtimeNotifications';
import AuthModal from '@/components/AuthModal';
import AIChatWidget from '@/components/AIChatWidget';
import RoleGuard from '@/components/RoleGuard';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/seller') || pathname?.startsWith('/driver') || pathname?.startsWith('/admin');

  return (
    <>
      <RoleGuard />
      <RealtimeNotifications />
      <AuthModal />
      {!isDashboard && <Navbar />}
      {!isDashboard && <CartDrawer />}
      {!isDashboard && <AIChatWidget />}
      {children}
    </>
  );
}
