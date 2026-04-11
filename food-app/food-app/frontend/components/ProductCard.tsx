'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/api/client';
import { useCartStore } from '@/store/cart';
import StarRating from './StarRating';
import WishlistButton from './WishlistButton';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Wishlist Button */}
      <WishlistButton productId={product.id} inCard={true} />
      
      {/* Image placeholder — clickable to detail */}
      <Link href={`/menu/${product.id}`}>
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary-100 via-accent-50 to-highlight-100 cursor-pointer">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl transition-transform duration-300 group-hover:scale-110">
              {getCategoryEmoji(product.category)}
            </span>
          </div>
          {/* Category badge */}
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm backdrop-blur-sm">
            {product.category}
          </span>
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              {product.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur-sm ${getTagStyle(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/menu/${product.id}`}>
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 hover:text-primary transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 flex-1 text-sm text-gray-500 line-clamp-2">
          {product.description}
        </p>

        {/* Star Rating */}
        {(product.averageRating !== undefined && product.averageRating > 0) && (
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={product.averageRating} readOnly size="sm" />
            <span className="text-xs text-gray-400">
              ({product.totalReviews} đánh giá)
            </span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xl font-extrabold text-primary">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (product.options && product.options.length > 0) {
                // Must select options first
                router.push(`/menu/${product.id}`);
                return;
              }

              try {
                addItem(product);
                openCart();
              } catch (err: any) {
                if (err.message === 'DIFFERENT_STORE') {
                  const confirmClear = window.confirm('Quán bạn chọn khác với quán của các món trong giỏ hàng. Xóa giỏ hàng hiện tại và thêm món này?');
                  if (confirmClear) {
                    useCartStore.getState().clearAndAddItem(product);
                    openCart();
                  }
                }
              }
            }}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
}

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

function getTagStyle(tag: string): string {
  const styles: Record<string, string> = {
    'Bán chạy': 'bg-red-500/90 text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]',
    'Hot': 'bg-red-500/90 text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]',
    'Cay': 'bg-orange-500/90 text-white',
    'Chay': 'bg-green-500/90 text-white',
    'Healthy': 'bg-emerald-500/90 text-white',
    'Ít calo': 'bg-blue-500/90 text-white',
    'Cao cấp': 'bg-purple-500/90 text-white',
  };
  return styles[tag] || 'bg-gray-500/90 text-white';
}
