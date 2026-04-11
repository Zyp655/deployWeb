import type { Metadata } from 'next';
import './globals.css';
import AppLayoutWrapper from '@/components/AppLayoutWrapper';

export const metadata: Metadata = {
  title: 'HOANG FOOD — Đặt đồ ăn trực tuyến',
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
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}
