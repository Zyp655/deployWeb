'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { fetchOrderById, Order, submitOrderReview } from '@/lib/api/client';
import { initSocket, disconnectSocket } from '@/lib/api/socket';
import StarRating from '@/components/StarRating';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const STEPS = [
  { id: 'PENDING', label: 'Chờ nhận', icon: '⏳' },
  { id: 'CONFIRMED', label: 'Đã nhận', icon: '✅' },
  { id: 'PREPARING', label: 'Đang nấu', icon: '👨‍🍳' },
  { id: 'PREPARED', label: 'Lên kho', icon: '📦' },
  { id: 'DELIVERING', label: 'Đang giao', icon: '🛵' },
  { id: 'DELIVERED', label: 'Đã giao', icon: '🎉' },
];

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { token } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [storeRating, setStoreRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = async () => {
    if (!token || !order) return;
    setSubmittingReview(true);
    try {
      const updated = await submitOrderReview(
        order.id,
        { storeRating, driverRating, reviewComment: reviewComment.trim() },
        token
      );
      setOrder(updated);
    } catch (err: any) {
      alert(err.message || 'Lỗi gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!token || !orderId) return;

    fetchOrderById(orderId, token)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    const socket = initSocket(token);
    socket.on('order-status-updated', (data) => {
      if (data.orderId === orderId) {
        setOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status,
            history: [
              ...(prev.history || []),
              {
                status: data.status,
                note: data.note,
                createdAt: data.timestamp,
              },
            ],
          };
        });
      }
    });

    return () => {
      socket.off('order-status-updated');
      disconnectSocket();
    };
  }, [orderId, token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-4xl animate-bounce inline-block">🍜</span>
          <p className="mt-3 text-sm text-gray-500">Đang tải đơn hàng...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <span className="text-5xl">😵</span>
        <p className="mt-4 text-lg font-semibold text-gray-700">
          {error || 'Không tìm thấy đơn hàng'}
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

  const currentIndex = STEPS.findIndex(s => s.id === order.status);
  const activePercent = STEPS.length > 1 ? (Math.max(0, currentIndex) / (STEPS.length - 1)) * 100 : 0;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* Success banner */}
        <div className="rounded-2xl bg-gradient-to-r from-primary via-accent to-highlight p-6 text-center text-white shadow-lg">
          <span className="text-5xl">🎉</span>
          <h1 className="mt-3 text-2xl font-extrabold">Đơn Hàng Của Bạn</h1>
          <p className="mt-1 text-sm text-white/80">
            Mã đơn: <span className="font-mono font-bold">{order.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>

        {/* Info */}
        <div className="mt-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Cửa hàng</p>
            <p className="text-gray-900 font-medium font-inter">{order.store?.name || '---'}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Giao đến</p>
            <p className="text-gray-900 font-medium font-inter max-w-xs">{order.deliveryAddress || '---'}</p>
          </div>
        </div>

        {/* Real-time Order Tracking Stepper */}
        <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Tiến trình đơn hàng</h2>
          
          <div className="relative">
            {/* Background line */}
            <div className="absolute top-5 left-[5%] right-[5%] h-1 bg-gray-100 rounded-full"></div>
            
            {/* Active filled line */}
            <div 
              className="absolute top-5 left-[5%] h-1 bg-primary rounded-full transition-all duration-700 ease-in-out"
              style={{ width: `${activePercent * 0.9}%` }}
            ></div>

            <div className="relative flex justify-between z-10">
              {STEPS.map((step, index) => {
                const isCompleted = index <= currentIndex;
                const isActive = index === currentIndex;
                
                const historyItem = order.history?.slice().reverse().find(h => h.status === step.id);
                const timeString = historyItem ? new Date(historyItem.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '---';

                return (
                  <div key={step.id} className={`flex flex-col items-center flex-1 ${step.id === 'PREPARED' ? 'hidden sm:flex' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 border-4 bg-white ${
                      isActive 
                        ? 'border-primary shadow-lg shadow-primary/20 scale-110' 
                        : isCompleted 
                          ? 'border-primary' 
                          : 'border-gray-100 grayscale opacity-40'
                    }`}>
                      {step.icon}
                    </div>
                    <span className={`mt-3 text-[11px] font-bold text-center ${isActive ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Món đã đặt</h2>
          <ul className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                  <p className="text-xs text-gray-400">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-bold text-gray-700 ml-4">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span>
              <span>{formatPrice((order.total - (order.shippingFee || 0) + (order.discount || 0)))}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span>{formatPrice(order.shippingFee || 0)}</span>
            </div>
            {order.discount !== undefined && order.discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Khuyến mãi</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-extrabold text-lg pt-2 mt-2 border-t border-dashed">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        {order.note && (
          <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Ghi chú</h2>
            <p className="text-sm text-gray-600">{order.note}</p>
          </div>
        )}

        {/* Payment Method */}
        {order.paymentMethod && (
          <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Phương thức thanh toán</h2>
            <p className="text-sm text-gray-600">
              {order.paymentMethod === 'COD' && '💵 Thanh toán khi nhận hàng (COD)'}
              {order.paymentMethod === 'MOMO' && '🟣 Ví MoMo'}
              {order.paymentMethod === 'VNPAY' && '🔴 VNPay'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Link
            href="/menu"
            className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-primary hover:text-primary"
          >
            Tiếp tục đặt món
          </Link>
        </div>

        {/* Review Section */}
        {order.status === 'DELIVERED' && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            {order.storeRating || order.driverRating ? (
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Cảm ơn bạn đã đánh giá! 💖</h2>
                {order.storeRating && (
                  <div className="flex justify-center items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-600">Điểm Quán:</span>
                    <StarRating value={order.storeRating} readOnly size="sm" />
                  </div>
                )}
                {order.driverRating && (
                  <div className="flex justify-center items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-gray-600">Điểm Tài xế:</span>
                    <StarRating value={order.driverRating} readOnly size="sm" />
                  </div>
                )}
                {order.reviewComment && (
                  <p className="text-sm text-gray-500 italic">"{order.reviewComment}"</p>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Đánh giá Trải nghiệm</h2>
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-800">Đánh giá Tiệm ăn</p>
                      <p className="text-xs text-gray-500">Chất lượng món ăn thế nào?</p>
                    </div>
                    <StarRating value={storeRating} onChange={setStoreRating} size="md" />
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-800">Đánh giá Tài xế</p>
                      <p className="text-xs text-gray-500">Thái độ phục vụ của tài xế?</p>
                    </div>
                    <StarRating value={driverRating} onChange={setDriverRating} size="md" />
                  </div>

                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Chia sẻ cảm nhận của bạn về trải nghiệm này..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px]"
                  />

                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-50"
                  >
                    {submittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}