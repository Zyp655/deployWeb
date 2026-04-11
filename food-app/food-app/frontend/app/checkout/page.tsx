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

  // If not logged in, open auth modal
  useEffect(() => {
    if (!user || !token) {
      openAuthModal('login');
    }
  }, [user, token, openAuthModal]);

  // If cart is empty, redirect to menu
  useEffect(() => {
    if (items.length === 0) {
      router.push('/menu');
    }
  }, [items.length, router]);

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
          })),
          address: address.trim(),
          paymentMethod,
          note: note.trim() || undefined,
        },
        token,
      );

      clearCart();

      // Handle payment method
      if (paymentMethod === 'MOMO') {
        const momoResult = await createMoMoPayment(
          order.id,
          totalPrice(),
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
          totalPrice(),
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
                    <p className="text-xs text-gray-400">
                      {formatPrice(item.product.price)} × {item.quantity}
                      {item.note && ` • ${item.note}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary ml-4">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-sm text-gray-500">Tổng ({totalItems()} món)</span>
              <span className="text-xl font-extrabold text-primary">{formatPrice(totalPrice())}</span>
            </div>
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
            {loading ? '⏳ Đang đặt hàng...' : `🛵 Xác nhận đặt hàng • ${formatPrice(totalPrice())}`}
          </button>
        </form>
      </div>
    </main>
  );
}
