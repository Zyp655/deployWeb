'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { createOrder, createMoMoPayment, createVNPayPayment, fetchActiveCoupons, CouponPublic, fetchStoreById } from '@/lib/api/client';

const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY || '';

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
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<{ distance: string; duration: string; text: string } | null>(null);
  const [etaLoading, setEtaLoading] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponResult, setCouponResult] = useState<{
    code: string;
    description: string | null;
    discount: number;
    finalTotal: number;
  } | null>(null);

  const [availableCoupons, setAvailableCoupons] = useState<CouponPublic[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCouponPicker, setShowCouponPicker] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      openAuthModal('login');
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Could not fetch location', err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [user, token, openAuthModal]);

  useEffect(() => {
    if (items.length === 0) {
      router.push('/menu');
    }
  }, [items.length, router]);

  useEffect(() => {
    if (!token) return;
    setCouponsLoading(true);
    const storeId = items[0]?.product?.storeId || undefined;
    fetchActiveCoupons(token, storeId)
      .then(setAvailableCoupons)
      .catch(() => {})
      .finally(() => setCouponsLoading(false));
  }, [token, items]);

  useEffect(() => {
    let active = true;
    const fetchEta = async () => {
      const storeId = items[0]?.product?.storeId;
      if (!userLocation || !storeId || !GOONG_API_KEY) return;
      
      setEtaLoading(true);
      try {
        const store = await fetchStoreById(storeId);
        if (store.lat && store.lng) {
          const res = await fetch(`https://rsapi.goong.io/Direction?origin=${store.lat},${store.lng}&destination=${userLocation.lat},${userLocation.lng}&vehicle=bike&api_key=${GOONG_API_KEY}`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0 && active) {
            const leg = data.routes[0].legs[0];
            const distance = leg.distance.text;
            // Add ~5 mins for prep
            const rawMins = Math.ceil(leg.duration.value / 60);
            const totalMins = rawMins + 5;
            setEta({ distance, duration: `${totalMins} phút`, text: leg.duration.text });
          }
        }
      } catch (err) {
        console.warn('Lỗi tải ETA:', err);
      } finally {
        if (active) setEtaLoading(false);
      }
    };
    fetchEta();
    return () => { active = false; };
  }, [userLocation, items]);

  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = codeOverride || couponCode;
    if (!token || !code.trim()) return;
    setCouponCode(code);
    setCouponLoading(true);
    setCouponError('');
    try {
      const { validateCoupon } = await import('@/lib/api/client');
      const res = await validateCoupon(code, totalPrice(), token);
      setCouponResult(res);
      setShowCouponPicker(false);
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : 'Lỗi mã giảm giá');
      setCouponResult(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const formatDiscount = (c: CouponPublic) => {
    if (c.discountType === 'PERCENT') {
      return `Giảm ${c.discountValue}%${c.maxDiscount ? ` (tối đa ${formatPrice(c.maxDiscount)})` : ''}`;
    }
    return `Giảm ${formatPrice(c.discountValue)}`;
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

    if (isScheduled && !scheduledAt) {
      setError('Vui lòng chọn thời gian giao hàng');
      return;
    }

    if (isScheduled && scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate.getTime() < Date.now() + 30 * 60000) {
        setError('Thời gian giao hàng hẹn trước phải cách hiện tại ít nhất 30 phút');
        return;
      }
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
          scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        },
        token,
      );

      clearCart();

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

          {/* Coupon Section */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">🏷️ Mã giảm giá</h2>
              {availableCoupons.length > 0 && !couponResult && (
                <button
                  type="button"
                  onClick={() => setShowCouponPicker(!showCouponPicker)}
                  className="text-sm font-bold text-primary hover:underline transition-all flex items-center gap-1"
                >
                  {showCouponPicker ? 'Ẩn bớt' : `Xem ${availableCoupons.length} mã có sẵn`}
                  <span className="text-xs">{showCouponPicker ? '▲' : '▼'}</span>
                </button>
              )}
            </div>

            {showCouponPicker && !couponResult && (
              <div className="mb-4 space-y-2 max-h-60 overflow-y-auto pr-1">
                {couponsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : availableCoupons.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Chưa có mã giảm giá nào</p>
                ) : (
                  availableCoupons.map((c) => {
                    const isEligible = totalPrice() >= c.minOrderValue;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        disabled={!isEligible || couponLoading}
                        onClick={() => handleApplyCoupon(c.code)}
                        className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                          isEligible
                            ? 'border-primary/30 bg-primary/5 hover:border-primary hover:shadow-sm cursor-pointer'
                            : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-primary/10 text-primary text-xs font-black px-2.5 py-1 rounded-lg tracking-wider">
                              {c.code}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {formatDiscount(c)}
                            </span>
                          </div>
                          {isEligible && (
                            <span className="text-primary text-xs font-bold">Áp dụng →</span>
                          )}
                        </div>
                        {c.description && (
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{c.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                          {c.minOrderValue > 0 && (
                            <span className={isEligible ? 'text-green-600' : 'text-red-500 font-semibold'}>
                              Đơn tối thiểu {formatPrice(c.minOrderValue)}
                            </span>
                          )}
                          {c.expiresAt && (
                            <span>HSD: {new Date(c.expiresAt).toLocaleDateString('vi-VN')}</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponError('');
                  if (couponResult) setCouponResult(null);
                }}
                placeholder="Nhập mã giảm giá..."
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium uppercase"
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                disabled={!couponCode.trim() || couponLoading || !!couponResult}
                className="rounded-xl px-5 py-3 text-sm font-bold text-white bg-gray-900 shadow-sm transition-all hover:bg-gray-800 disabled:opacity-50"
              >
                {couponLoading ? '⏳' : couponResult ? 'Đã áp dụng' : 'Áp dụng'}
              </button>
            </div>
            {couponError && <p className="mt-2 text-sm text-red-600 font-medium">{couponError}</p>}
            {couponResult && (
              <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm text-green-700 font-bold">✅ Áp dụng thành công!</p>
                  <p className="text-xs text-green-600 mt-0.5">Giảm {formatPrice(couponResult.discount)} với mã {couponResult.code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCouponResult(null);
                    setCouponCode('');
                    setCouponError('');
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                >
                  Bỏ mã
                </button>
              </div>
            )}
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
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all resize-none mb-4"
            />
            {/* ETA Widget */}
            {(eta || etaLoading) && (
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">
                    ⏱️
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Dự kiến nhận hàng</p>
                    {etaLoading ? (
                      <div className="h-5 w-24 bg-blue-200/50 rounded mt-1 animate-pulse" />
                    ) : (
                      <p className="text-sm font-semibold text-blue-900 mt-0.5">
                        <span className="font-black text-lg text-blue-600">{eta?.duration}</span> (khoảng {eta?.distance})
                      </p>
                    )}
                  </div>
                </div>
                {!etaLoading && (
                  <div className="hidden sm:block text-xs text-blue-700/70 font-medium bg-blue-100/50 px-2 py-1 rounded-md">
                    Bao gồm 5p chuẩn bị
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Delivery Time */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
             <h2 className="text-lg font-bold text-gray-900 mb-3">🕒 Thời gian giao hàng</h2>
             <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                <button
                   type="button"
                   onClick={() => setIsScheduled(false)}
                   className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isScheduled ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                   Giao ngay
                </button>
                <button
                   type="button"
                   onClick={() => setIsScheduled(true)}
                   className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isScheduled ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                   Hẹn giờ
                </button>
             </div>
             
             {isScheduled && (
                <div className="animate-fade-in">
                   <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Chọn thời gian nhận (Cách ít nhất 30 phút)
                   </label>
                   <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => {
                         setScheduledAt(e.target.value);
                         setError('');
                      }}
                      min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                   />
                </div>
             )}
          </section>

          {/* Schedule Delivery */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">🕒 Hẹn giờ giao hàng (Tùy chọn)</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date(Date.now() + 30 * 60000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                className="w-full sm:w-auto rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
              <p className="text-xs text-gray-500">
                Lưu ý: Thời gian nhận hàng phải cách hiện tại tối thiểu 30 phút. Nếu không chọn, chúng tôi sẽ giao sớm nhất có thể.
              </p>
            </div>
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
