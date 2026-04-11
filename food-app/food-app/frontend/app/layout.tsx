import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import RealtimeNotifications from '@/components/RealtimeNotifications';
import AuthModal from '@/components/AuthModal';
import AIChatWidget from '@/components/AIChatWidget';

export const metadata: Metadata = {
  title: 'Food App — Đặt đồ ăn trực tuyến',
  description: 'Nền tảng đặt đồ ăn trực tuyến tích hợp AI. Gợi ý món ăn thông minh, theo dõi đơn hàng realtime.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <Navbar />
        <CartDrawer />
        <RealtimeNotifications />
        <AuthModal />
        <AIChatWidget />
        {children}
      </body>
    </html>
  );
}
