'use client';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'DRIVER') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'DRIVER') return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-white border-r shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold font-inter text-primary">Tài Xế - {user.name}</h2>
          <nav className="mt-8 space-y-2">
           <Link 
              href="/driver" 
              className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-primary rounded-md transition-colors"
            >
              Bảng Săn Đơn
            </Link>
            <Link 
              href="/driver/my-orders" 
              className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-primary rounded-md transition-colors"
            >
              Đơn Đã Nhận
            </Link>
          </nav>
        </div>
      </div>
      <div className="flex-1 p-8 overflow-auto">{children}</div>
    </div>
  );
}
