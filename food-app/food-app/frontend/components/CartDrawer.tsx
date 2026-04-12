'use client';

import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Món nước': '🍜',
    'Món khô': '🥖',
    'Cơm': '🍚',
    'Khai vị': '🥗',
    'Món mặn': '🥩',
    'Tráng miệng': '🍮',
    'Đồ uống': '🍵',
  };
  return map[category] || '🍽️';
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    updateNote,
    clearCart,
    totalItems,
    totalPrice,
  } = useCartStore();
  const { user, openAuthModal } = useAuthStore();
  const router = useRouter();

  const handleCheckout = () => {
    closeCart();
    if (!user) {
      openAuthModal('login');
      return;
    }
    router.push('/checkout');
  };

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeCart}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-gray-900">Giỏ hàng</h2>
            {totalItems() > 0 && (
              <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                {totalItems()}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <span className="text-6xl">🛒</span>
              <p className="mt-4 text-lg font-semibold text-gray-700">
                Giỏ hàng trống
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Thêm món ăn từ thực đơn nhé!
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 px-5">
              {items.map((item) => {
                const optionsPrice = item.selectedOptions?.reduce((sum, opt) => sum + opt.price, 0) || 0;
                const unitPrice = item.product.price + optionsPrice;

                return (
                <li key={item.cartItemId} className="py-4">
                  <div className="flex gap-3">
                    {/* Image or Emoji avatar */}
                    <CartItemImg category={item.product.category} image={item.product.image} name={item.product.name} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                          {item.product.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.cartItemId)}
                          className="flex-shrink-0 rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                            <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>

                      <p className="text-sm font-semibold text-primary">
                        {formatPrice(unitPrice)}
                      </p>

                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.selectedOptions.map(opt => `${opt.group}: ${opt.choice}`).join(' | ')}
                        </p>
                      )}

                      {/* Quantity controls */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-gray-200">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-primary rounded-l-lg"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                              <path d="M3.75 7.25a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z" />
                            </svg>
                          </button>
                          <span className="flex h-8 w-8 items-center justify-center text-sm font-bold text-gray-900 border-x border-gray-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-primary rounded-r-lg"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                              <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-accent">
                          {formatPrice(unitPrice * item.quantity)}
                        </span>
                      </div>

                      {/* Note input */}
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) =>
                          updateNote(item.cartItemId, e.target.value)
                        }
                        placeholder="Ghi chú thêm..."
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 placeholder:text-gray-300 focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 transition-colors"
                      />
                    </div>
                  </div>
                </li>
              )})}
            </ul>
          )}
        </div>

        {/* Footer — Total + CTA */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            {/* Clear cart */}
            <button
              onClick={clearCart}
              className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
            >
              Xóa tất cả
            </button>

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Tổng cộng ({totalItems()} món)
              </span>
              <span className="text-xl font-extrabold text-primary">
                {formatPrice(totalPrice())}
              </span>
            </div>

            {/* Order button */}
            <button
              onClick={handleCheckout}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3.5 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
            >
              🛵 Đặt hàng
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function CartItemImg({ category, image, name }: { category: string, image?: string | null, name: string }) {
  const [imgError, setImgError] = useState(false);
  const resolveImageUrl = (url: string | null | undefined) => {
    if (!url || url === '/images/default.jpg') return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${url}`;
  };

  return (
    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 via-accent-50 to-highlight-50 overflow-hidden relative">
      {resolveImageUrl(image) ? (
        <>
          <img 
            src={resolveImageUrl(image)!} 
            alt={name} 
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const nextSib = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
              if (nextSib) nextSib.style.display = 'flex';
            }}
          />
          <div className="absolute inset-0 items-center justify-center" style={{ display: 'none' }}>
            <span className="text-2xl">
              {getCategoryEmoji(category)}
            </span>
          </div>
        </>
      ) : (
        <span className="text-2xl">
          {getCategoryEmoji(category)}
        </span>
      )}
    </div>
  );
}
