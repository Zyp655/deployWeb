'use client';


import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchProductById, fetchProductReviews, fetchProductRating, createReview, fetchMyOrders, ProductDetail, Review, SelectedOption } from '@/lib/api/client';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import StarRating from '@/components/StarRating';
import WishlistButton from '@/components/WishlistButton';
import OptionSelector from '@/components/OptionSelector';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Món nước': '🍜',
    'Món khô': '🥖',
    Cơm: '🍚',
    'Khai vị': '🥗',
    'Món mặn': '🥩',
    'Tráng miệng': '🍮',
    'Đồ uống': '🍵',
  };
  return map[category] || '🍽️';
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { user, token, openAuthModal } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [hasOrderedProduct, setHasOrderedProduct] = useState(false);
  const [checkingOrders, setCheckingOrders] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Fetch product details
  useEffect(() => {
    if (!productId) return;
    fetchProductById(productId)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  // Fetch reviews separately
  useEffect(() => {
    if (!productId) return;
    fetchProductReviews(productId)
      .then(setReviews)
      .catch((err) => console.error('Error fetching reviews:', err));
  }, [productId]);

  // Fetch rating separately
  useEffect(() => {
    if (!productId) return;
    fetchProductRating(productId)
      .then((data) => {
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews);
      })
      .catch((err) => console.error('Error fetching rating:', err));
  }, [productId]);

  // Check if user has ordered this product
  useEffect(() => {
    if (!user || !token || !productId) {
      setHasOrderedProduct(false);
      return;
    }

    setCheckingOrders(true);
    fetchMyOrders(token)
      .then((orders) => {
        const hasCompletedOrder = orders.some((order) => {
          const isCompletedOrDelivered = order.status === 'DELIVERED' || order.status === 'COMPLETED';
          const hasProduct = order.items.some((item) => item.productName === product?.name);
          return isCompletedOrDelivered && hasProduct;
        });
        setHasOrderedProduct(hasCompletedOrder);
      })
      .catch((err) => console.error('Error checking orders:', err))
      .finally(() => setCheckingOrders(false));
  }, [user, token, productId, product?.name]);

  const handleAddToCart = () => {
    if (!product) return;

    if (product.options) {
      const missingRequired = product.options.find(
        (g) => g.isRequired && !selectedOptions.some((opt) => opt.group === g.name)
      );
      if (missingRequired) {
        alert(`Vui lòng chọn ${missingRequired.name}`);
        return;
      }
    }

    try {
      for (let i = 0; i < quantity; i++) {
        addItem(product, selectedOptions);
      }
    } catch (err: any) {
      if (err.message === 'DIFFERENT_STORE') {
        const confirmClear = window.confirm('Quán bạn chọn khác với quán của các món trong giỏ hàng. Xóa giỏ hàng hiện tại và thêm món này?');
        if (confirmClear) {
          useCartStore.getState().clearAndAddItem(product, selectedOptions);
          // Restore the rest of quantity
          for (let i = 1; i < quantity; i++) {
             useCartStore.getState().addItem(product, selectedOptions);
          }
        }
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) {
      openAuthModal('login');
      return;
    }
    if (reviewRating === 0) {
      setReviewError('Vui lòng chọn số sao');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError('Vui lòng nhập nhận xét');
      return;
    }

    setReviewError('');
    setReviewLoading(true);

    try {
      const newReview = await createReview(productId, reviewRating, reviewComment.trim(), token);
      
      // Update reviews list
      setReviews((prev) => [newReview, ...prev]);
      
      // Refetch rating
      const ratingData = await fetchProductRating(productId);
      setAverageRating(ratingData.averageRating);
      setTotalReviews(ratingData.totalReviews);
      
      setReviewSuccess(true);
      setReviewRating(0);
      setReviewComment('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
      setReviewError(message);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-5xl animate-bounce inline-block">🍜</span>
          <p className="mt-3 text-sm text-gray-500">Đang tải...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <span className="text-5xl">😵</span>
        <p className="mt-4 text-lg font-semibold text-gray-700">
          {error || 'Không tìm thấy sản phẩm'}
        </p>
        <Link
          href="/menu"
          className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-600"
        >
          Quay lại thực đơn
        </Link>
      </main>
    );
  }

  const alreadyReviewed = reviews.some((r) => r.user.id === user?.id);
  const canReview = user && hasOrderedProduct && !alreadyReviewed;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-100 via-accent-50 to-highlight-100">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-primary transition-colors mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
            Quay lại thực đơn
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Image */}
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-white/60 backdrop-blur-sm shadow-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {product.image && product.image !== '/images/default.jpg' ? (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[120px] md:text-[150px] drop-shadow-lg">
                  {getCategoryEmoji(product.category)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block rounded-full bg-white/80 px-4 py-1.5 text-xs font-bold text-primary-700 backdrop-blur-sm shadow-sm mb-3">
                {product.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                {product.name}
              </h1>
              <p className="mt-3 text-gray-600 text-base md:text-lg leading-relaxed max-w-xl">
                {product.description}
              </p>

              {/* Rating */}
              <div className="mt-4 flex items-center gap-3 justify-center md:justify-start">
                <StarRating value={averageRating} readOnly size="lg" showValue />
                <span className="text-sm text-gray-500">
                  ({totalReviews} đánh giá)
                </span>
              </div>

              {/* Options Selector */}
              {product.options && product.options.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-2">
                  <OptionSelector 
                    options={product.options} 
                    selectedOptions={selectedOptions} 
                    onChange={setSelectedOptions} 
                  />
                </div>
              )}

              {/* Price + Add to Cart */}
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 border-t border-gray-100 pt-6">
                <span className="text-3xl font-extrabold text-primary">
                  {formatPrice(product.price + selectedOptions.reduce((acc, opt) => acc + opt.price, 0))}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border-2 border-gray-200 bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-gray-500 hover:text-primary transition-colors font-bold text-lg"
                    >
                      −
                    </button>
                    <span className="px-3 py-2 text-sm font-bold text-gray-900 min-w-[2rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-gray-500 hover:text-primary transition-colors font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:brightness-110 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                    </svg>
                    Thêm vào giỏ
                  </button>
                  <WishlistButton productId={product.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
          ⭐ Đánh giá ({totalReviews})
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Review Form - Left side */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Viết đánh giá</h3>

              {!user ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">
                    Đăng nhập để đánh giá
                  </p>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
                  >
                    Đăng nhập
                  </button>
                </div>
              ) : alreadyReviewed ? (
                <div className="text-center py-4">
                  <span className="text-3xl">✅</span>
                  <p className="mt-2 text-sm text-gray-600 font-medium">
                    Bạn đã đánh giá món này rồi
                  </p>
                </div>
              ) : !hasOrderedProduct ? (
                <div className="text-center py-4">
                  {checkingOrders ? (
                    <>
                      <span className="text-3xl">⏳</span>
                      <p className="mt-2 text-sm text-gray-500 font-medium">
                        Đang kiểm tra...
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">📦</span>
                      <p className="mt-2 text-sm text-gray-600 font-medium">
                        Bạn cần đặt và nhận món này trước khi đánh giá
                      </p>
                    </>
                  )}
                </div>
              ) : reviewSuccess ? (
                <div className="text-center py-4">
                  <span className="text-3xl">🎉</span>
                  <p className="mt-2 text-sm text-green-600 font-semibold">
                    Cảm ơn bạn đã đánh giá!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Đánh giá sao
                    </label>
                    <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nhận xét
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn..."
                      rows={4}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all resize-none"
                    />
                  </div>

                  {reviewError && (
                    <p className="text-sm text-red-500 font-medium">{reviewError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3 text-sm font-bold text-white shadow-md shadow-amber-200/50 transition-all duration-200 hover:shadow-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                  >
                    {reviewLoading ? '⏳ Đang gửi...' : '⭐ Gửi đánh giá'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Reviews List - Right side */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-100 text-center">
                <span className="text-5xl">📝</span>
                <p className="mt-3 text-gray-500 font-medium">
                  Chưa có đánh giá nào. Hãy là người đầu tiên!
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-sm font-bold text-primary-700">
            {review.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{review.user.name}</p>
            <p className="text-xs text-gray-400">
              {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <StarRating value={review.rating} readOnly size="sm" />
      </div>
      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
      
      {review.sellerReply && (
        <div className="mt-4 bg-primary/5 border border-primary/10 rounded-xl p-3 relative">
          <div className="absolute -top-2 left-4 w-3 h-3 bg-primary/5 border-t border-l border-primary/10 transform rotate-45"></div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Phản hồi từ quán
            </span>
            <span className="text-[10px] text-gray-400">
              {review.replyAt ? new Date(review.replyAt).toLocaleDateString('vi-VN') : ''}
            </span>
          </div>
          <p className="text-sm text-gray-700">{review.sellerReply}</p>
        </div>
      )}
    </div>
  );
}