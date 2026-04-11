'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { createOrder, createMoMoPayment, createVNPayPayment } from '@/lib/api/client';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const PAYMENT_METHODS = [
  { id: 'COD', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵' },
  { id: 'MOMO', label: 'Ví MoMo', icon: '🟣' },
  { id: 'VNPAY', label: 'VNPay', icon: '🔴' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalItems, clearCart } = useCartStore();
  const { user, token, openAuthModal } = useAuthStore();

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponResult, setCouponResult] = useState<{
    code: string;
    description: string | null;
    discount: number;
    finalTotal: number;
  } | null>(null);

  // If not logged in, open auth modal
  useEffect(() => {
    if (!user || !token) {
      openAuthModal('login');
    }
    
    // Auto-fetch location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Could not fetch location', err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [user, token, openAuthModal]);

  // If cart is empty, redirect to menu
  useEffect(() => {
    if (items.length === 0) {
      router.push('/menu');
    }
  }, [items.length, router]);

  const handleApplyCoupon = async () => {
    if (!token || !couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { validateCoupon } = await import('@/lib/api/client');
      const res = await validateCoupon(couponCode, totalPrice(), token);
      setCouponResult(res);
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : 'Lỗi mã giảm giá');
      setCouponResult(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) {
      openAuthModal('login');
      return;
    }
    if (!address.trim()) {
      setError('Vui lòng nhập địa chỉ giao hàng');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const order = await createOrder(
        {
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            note: item.note || undefined,
            selectedOptions: item.selectedOptions || undefined,
          })),
          address: address.trim(),
          paymentMethod,
          note: note.trim() || undefined,
          couponCode: couponResult?.code,
          userLat: userLocation?.lat,
          userLng: userLocation?.lng,
        },
        token,
      );

      clearCart();

      // Handle payment method
      if (paymentMethod === 'MOMO') {
        const momoResult = await createMoMoPayment(
          order.id,
          couponResult ? couponResult.finalTotal : totalPrice(),
          `Thanh toán đơn hàng ${order.id}`,
          token,
        );
        if (momoResult.payUrl) {
          window.location.href = momoResult.payUrl;
          return;
        }
      } else if (paymentMethod === 'VNPAY') {
        const vnpayResult = await createVNPayPayment(
          order.id,
          couponResult ? couponResult.finalTotal : totalPrice(),
          `Thanh toán đơn hàng ${order.id}`,
          token,
        );
        if (vnpayResult.paymentUrl) {
          window.location.href = vnpayResult.paymentUrl;
          return;
        }
      }

      // COD or fallback
      router.push(`/orders/${order.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-extrabold text-gray-900">🧾 Thanh toán</h1>
        <p className="mt-1 text-sm text-gray-500">Xác nhận đơn hàng và chọn phương thức thanh toán</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Order Summary */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
            <ul className="divide-y divide-gray-50">
              {items.map((item) => (
                <li key={item.product.id} className="flex items-center justify-between py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatPrice(item.product.price + (item.selectedOptions?.reduce((acc, opt) => acc + opt.price, 0) || 0))} × {item.quantity}
                      {item.note && ` • ${item.note}`}
                    </p>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                         {item.selectedOptions.map(opt => `${opt.group}: ${opt.choice}`).join(' | ')}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-primary ml-4">
                    {formatPrice((item.product.price + (item.selectedOptions?.reduce((acc, opt) => acc + opt.price, 0) || 0)) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tạm tính ({totalItems()} món)</span>
                <span className="text-sm font-semibold">{formatPrice(totalPrice())}</span>
              </div>
              
              {couponResult && (
                <div className="flex items-center justify-between text-green-600">
                  <span className="text-sm font-semibold">Giảm giá ({couponResult.code})</span>
                  <span className="text-sm font-bold">-{formatPrice(couponResult.discount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-bold text-gray-900">Tổng thanh toán</span>
                <span className="text-xl font-extrabold text-primary">
                  {formatPrice(couponResult ? couponResult.finalTotal : totalPrice())}
                </span>
              </div>
            </div>
          </section>

          {/* Coupon Code */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">🏷️ Mã giảm giá</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponError('');
                  if (couponResult) setCouponResult(null); // Reset when changing
                }}
                placeholder="Nhập mã giảm giá..."
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium uppercase"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || couponLoading || !!couponResult}
                className="rounded-xl px-5 py-3 text-sm font-bold text-white bg-gray-900 shadow-sm transition-all hover:bg-gray-800 disabled:opacity-50"
              >
                {couponLoading ? '⏳' : couponResult ? 'Đã áp dụng' : 'Áp dụng'}
              </button>
            </div>
            {couponError && <p className="mt-2 text-sm text-red-600 font-medium">{couponError}</p>}
            {couponResult && <p className="mt-2 text-sm text-green-600 font-medium">✅ Áp dụng thành công! Giảm {formatPrice(couponResult.discount)}</p>}
          </section>

          {/* Delivery Address */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">📍 Địa chỉ giao hàng</h2>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, thành phố..."
              required
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all resize-none"
            />
          </section>

          {/* Payment Method */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">💳 Phương thức thanh toán</h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                    paymentMethod === method.id
                      ? 'border-primary bg-primary-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-xl">{method.icon}</span>
                  <span className={`text-sm font-semibold ${
                    paymentMethod === method.id ? 'text-primary-700' : 'text-gray-700'
                  }`}>
                    {method.label}
                  </span>
                  {paymentMethod === method.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="ml-auto h-5 w-5 text-primary">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </section>

          {/* Note */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">📝 Ghi chú thêm</h2>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho shipper (tùy chọn)"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !user}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-4 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Đang đặt hàng...' : `🛵 Xác nhận đặt hàng • ${formatPrice(couponResult ? couponResult.finalTotal : totalPrice())}`}
          </button>
        </form>
      </div>
    </main>
  );
}
