'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';

export default function Navbar() {
  const totalItems = useCartStore((state) => state.totalItems);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold text-primary transition-colors hover:text-primary-600"
        >
          <span className="text-2xl">🍜</span>
          <span className="hidden sm:inline">Food App</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/menu"
            className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary"
          >
            Thực đơn
          </Link>

          {/* Auth section */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm font-semibold text-gray-700 sm:inline">
                  {user.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110 active:scale-95"
            >
              Đăng nhập
            </button>
          )}

          {/* Cart icon with badge */}
          <button
            onClick={toggleCart}
            className="relative rounded-full bg-gray-100 p-2.5 transition-colors hover:bg-primary-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-gray-700"
            >
              <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
            </svg>
            {totalItems() > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm">
                {totalItems()}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
