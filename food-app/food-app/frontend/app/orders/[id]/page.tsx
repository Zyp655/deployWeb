'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { fetchOrderById, Order, submitOrderReview, cancelOrder } from '@/lib/api/client';
import { initSocket, disconnectSocket } from '@/lib/api/socket';
import { useCartStore, generateCartItemId, CartItem } from '@/store/cart';
import { useRouter } from 'next/navigation';
import StarRating from '@/components/StarRating';
import LiveChatWidget from '@/components/LiveChatWidget';
import dynamic from 'next/dynamic';

const CustomerTrackingMap = dynamic(() => import('@/components/CustomerTrackingMap'), { ssr: false });

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const STEPS = [
  { id: 'PENDING', label: 'Chờ nhận', icon: '⏳' },
  { id: 'CONFIRMED', label: 'Đã nhận', icon: '✅' },
  { id: 'PREPARING', label: 'Đang nấu', icon: '👨‍🍳' },
  { id: 'PREPARED', label: 'Chờ tài xế', icon: '📦' },
  { id: 'PICKING_UP', label: 'Lấy hàng', icon: '🏃' },
  { id: 'DELIVERING', label: 'Đang giao', icon: '🛵' },
  { id: 'DELIVERED', label: 'Đã giao', icon: '🎉' },
];

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { user, token } = useAuthStore();
  const router = useRouter();
  const reorder = useCartStore(s => s.reorder);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);

  const [storeRating, setStoreRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [driverTip, setDriverTip] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [driverInfo, setDriverInfo] = useState<{ name: string; vehiclePlate: string; vehicleType: string; rating: number; phone: string } | null>(null);

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleSubmitReview = async () => {
    if (!token || !order) return;
    setSubmittingReview(true);
    try {
      const updated = await submitOrderReview(
        order.id,
        { storeRating, driverRating, reviewComment: reviewComment.trim(), driverTip: driverTip > 0 ? driverTip : undefined },
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

    socket.on('driver-assigned', (data) => {
      if (data.orderId === orderId && data.driver) {
        setDriverInfo(data.driver);
      }
    });

    socket.on('driver-location-updated', (data) => {
      if (data.orderId === orderId && data.lat && data.lng) {
        setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      socket.off('order-status-updated');
      socket.off('driver-assigned');
      socket.off('driver-location-updated');
      disconnectSocket();
    };
  }, [orderId, token]);

  const handleCallDriver = useCallback(() => {
    const phone = driverInfo?.phone || order?.driver?.phone;
    if (phone) window.open(`tel:${phone}`);
  }, [driverInfo, order]);

  const handleChatDriver = useCallback(() => {
    setShowChat(true);
  }, []);

  const isTracking = order && (order.status === 'PICKING_UP' || order.status === 'DELIVERING');
  const hasDriverLocation = driverLocation && driverLocation.lat && driverLocation.lng;
  const customerLat = order?.deliveryLat;
  const customerLng = order?.deliveryLng;
  const showTrackingMap = isTracking && hasDriverLocation && customerLat && customerLng;

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
          {order.isScheduled && order.scheduledAt && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-bold text-white shadow-sm ring-1 ring-white/30 backdrop-blur-sm">
              🕒 Giao hẹn lúc: {new Date(order.scheduledAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
            </div>
          )}
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
            <div className="absolute top-5 left-[5%] right-[5%] h-1 bg-gray-100 rounded-full"></div>
            <div 
              className="absolute top-5 left-[5%] h-1 bg-primary rounded-full transition-all duration-700 ease-in-out"
              style={{ width: `${activePercent * 0.9}%` }}
            ></div>

            <div className="relative flex justify-between z-10">
              {STEPS.map((step, index) => {
                const isCompleted = index <= currentIndex;
                const isActive = index === currentIndex;

                return (
                  <div key={step.id} className={`flex flex-col items-center flex-1 ${(step.id === 'PREPARED' || step.id === 'PICKING_UP') ? 'hidden sm:flex' : ''}`}>
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

        {/* Real-time Tracking Map */}
        {showTrackingMap && (
          <div className="mt-4">
            <CustomerTrackingMap
              driverLat={driverLocation!.lat}
              driverLng={driverLocation!.lng}
              customerLat={customerLat!}
              customerLng={customerLng!}
              orderStatus={order.status as 'PICKING_UP' | 'DELIVERING'}
              driverInfo={driverInfo ? {
                name: driverInfo.name,
                phone: driverInfo.phone,
                vehiclePlate: driverInfo.vehiclePlate,
                vehicleType: driverInfo.vehicleType,
                rating: driverInfo.rating,
              } : order.driver ? {
                name: order.driver.name,
                phone: order.driver.phone,
              } : null}
              orderId={order.id}
              orderTotal={order.total}
              paymentMethod={order.paymentMethod}
              onCallDriver={handleCallDriver}
              onChatDriver={handleChatDriver}
            />
          </div>
        )}

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
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      {item.selectedOptions.map(opt => `${opt.group}: ${opt.choice}`).join(' | ')}
                    </p>
                  )}
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
              {order.paymentMethod === 'SEPAY' && '🏦 Chuyển khoản (VietQR)'}
            </p>
          </div>
        )}

        {/* Driver Info (when no tracking map) */}
        {(order.status === 'PICKING_UP' || order.status === 'DELIVERING') && !showTrackingMap && (driverInfo || order.driver) && (
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-2xl font-bold">
                  {(driverInfo?.name || order.driver?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-lg">{driverInfo?.name || order.driver?.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    {driverInfo?.vehiclePlate && <span>🏍️ {driverInfo.vehiclePlate}</span>}
                    {driverInfo?.rating && <span>⭐ {driverInfo.rating.toFixed(1)}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {(driverInfo?.phone || order.driver?.phone) && (
                  <a href={`tel:${driverInfo?.phone || order.driver?.phone}`} className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-lg hover:bg-green-600 transition-colors">
                    📞
                  </a>
                )}
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              {order.status === 'PICKING_UP' ? '🏪 Tài xế đang đến quán lấy hàng cho bạn...' : '🛵 Tài xế đang trên đường giao hàng...'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {order.status === 'PENDING' && order.paymentMethod === 'SEPAY' && (
            <button
              onClick={() => router.push(`/payment/${order.paymentMethod?.toLowerCase() || ''}/${order.id}`)}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-center text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 active:scale-95"
            >
              💳 Thanh toán lại
            </button>
          )}

          {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-1 rounded-xl border-2 border-red-200 bg-red-50 py-3 text-center text-sm font-bold text-red-600 transition-colors hover:bg-red-100 hover:border-red-300"
            >
              🚫 Huỷ đơn
            </button>
          )}

          {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
            <button
              onClick={() => {
                if (!order || !order.items) return;
                const cartItems: CartItem[] = order.items
                  .filter(item => item.product) // Only add if product details exist
                  .map(item => ({
                    cartItemId: generateCartItemId(item.productId || item.product!.id, item.selectedOptions),
                    product: item.product!,
                    quantity: item.quantity,
                    note: '',
                    selectedOptions: item.selectedOptions,
                  }));
                
                if (cartItems.length > 0) {
                  reorder(cartItems);
                  router.push('/checkout');
                } else {
                  alert('Không thể đặt lại đơn hàng này do sản phẩm không còn tồn tại.');
                }
              }}
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-center text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-95"
            >
              🔄 Mua lại đơn này
            </button>
          )}

          <Link
            href="/menu"
            className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-primary hover:text-primary"
          >
            Tiếp tục đặt món
          </Link>
          <Link
            href="/orders"
            className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-primary hover:text-primary"
          >
            📦 Lịch sử đơn
          </Link>
        </div>

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fade-up">
              <h3 className="text-lg font-bold text-gray-900 mb-1">🚫 Huỷ đơn hàng</h3>
              <p className="text-sm text-gray-500 mb-4">Chọn lý do huỷ đơn hàng của bạn</p>

              <div className="space-y-2 mb-4">
                {['Đổi ý, không muốn đặt nữa', 'Đặt nhầm món / sai địa chỉ', 'Thời gian chờ quá lâu', 'Tìm được quán khác rẻ hơn', 'Lý do khác'].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setCancelReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      cancelReason === reason
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {cancelReason === 'Lý do khác' && (
                <textarea
                  value={cancelReason === 'Lý do khác' ? '' : cancelReason}
                  onChange={(e) => setCancelReason(e.target.value || 'Lý do khác')}
                  placeholder="Nhập lý do cụ thể..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm mb-4 focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 min-h-[80px]"
                />
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                  className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={async () => {
                    if (!cancelReason || !token) return;
                    setCancelling(true);
                    try {
                      await cancelOrder(order.id, cancelReason, token);
                      setOrder(prev => prev ? { ...prev, status: 'CANCELLED' } : prev);
                      setShowCancelModal(false);
                      setCancelReason('');
                    } catch (err: any) {
                      alert(err.message || 'Lỗi huỷ đơn');
                    } finally {
                      setCancelling(false);
                    }
                  }}
                  disabled={!cancelReason || cancelling}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? '⏳ Đang huỷ...' : 'Xác nhận huỷ'}
                </button>
              </div>
            </div>
          </div>
        )}

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

                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-800">Tip Tài xế 💝</p>
                      <p className="text-xs text-gray-500">Cảm ơn tài xế đã phục vụ</p>
                    </div>
                    <div className="flex gap-2">
                      {[0, 5000, 10000, 20000].map((tip) => (
                        <button
                          key={tip}
                          onClick={() => setDriverTip(tip)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            driverTip === tip
                              ? 'bg-orange-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {tip === 0 ? 'Không' : `${new Intl.NumberFormat('vi-VN').format(tip)}đ`}
                        </button>
                      ))}
                    </div>
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
                    {submittingReview ? 'Đang gửi...' : `Gửi Đánh Giá${driverTip > 0 ? ` + Tip ${new Intl.NumberFormat('vi-VN').format(driverTip)}đ` : ''}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Chat with Driver */}
      {showChat && order.driver && user && (
        <LiveChatWidget 
          orderId={order.id}
          receiverId={order.driver.id}
          receiverName={order.driver.name}
          receiverRole="DRIVER"
          currentUserId={user.id}
        />
      )}
      {!showChat && order.driver && user && (
        <LiveChatWidget 
          orderId={order.id}
          receiverId={order.driver.id}
          receiverName={order.driver.name}
          receiverRole="DRIVER"
          currentUserId={user.id}
        />
      )}
    </main>
  );
}