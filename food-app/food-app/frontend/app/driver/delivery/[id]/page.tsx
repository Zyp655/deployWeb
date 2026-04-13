'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter, useParams } from 'next/navigation';
import {
  fetchActiveDelivery,
  pickedUpOrder,
  completeOrder,
  rejectDriverOrder,
  DriverOrder,
} from '@/lib/api/client';
import { io, Socket } from 'socket.io-client';
import LiveChatWidget from '@/components/LiveChatWidget';
import DriverRouteMap from '@/components/DriverRouteMap';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_STEPS = [
  { key: 'PICKING_UP', label: 'Đang lấy hàng', icon: '🏪' },
  { key: 'DELIVERING', label: 'Đang giao', icon: '🛵' },
  { key: 'DELIVERED', label: 'Đã giao', icon: '✅' },
];

export default function ActiveDeliveryPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<DriverOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [driverPos, setDriverPos] = useState<{lat: number, lng: number} | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token || !orderId) return;
    loadOrder();

    const socket = io(WS_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
      stopGPS();
    };
  }, [token, orderId]);

  useEffect(() => {
    if (order && (order.status === 'PICKING_UP' || order.status === 'DELIVERING')) {
      startGPS();
    }
    return () => stopGPS();
  }, [order?.status]);

  const loadOrder = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const active = await fetchActiveDelivery(token);
      if (active && active.id === orderId) {
        setOrder(active);
      } else {
        router.push('/driver');
      }
    } catch {
      router.push('/driver');
    }
    setLoading(false);
  };

  const startGPS = () => {
    if (!navigator.geolocation || watchIdRef.current) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDriverPos({ lat: latitude, lng: longitude });
        if (socketRef.current && order) {
          socketRef.current.emit('update-driver-location', {
            orderId: order.id,
            customerId: order.user?.id || order.userId,
            lat: latitude,
            lng: longitude,
          });
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const stopGPS = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handlePickedUp = async () => {
    if (!token || !order || processing) return;
    setProcessing(true);
    try {
      const updated = await pickedUpOrder(order.id, token);
      setOrder({ ...order, status: updated.status || 'DELIVERING' });
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
    setProcessing(false);
  };

  const handleComplete = async () => {
    if (!token || !order || processing) return;
    if (!confirm('Xác nhận đã giao hàng thành công cho khách?')) return;
    setProcessing(true);
    try {
      await completeOrder(order.id, token);
      router.push('/driver');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!token || !order || !rejectReason.trim() || processing) return;
    setProcessing(true);
    try {
      await rejectDriverOrder(order.id, rejectReason, token);
      router.push('/driver');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
    setProcessing(false);
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === order.status);

  // Compute Target Logic for Routing Map
  const isPickingUp = order.status === 'PICKING_UP';
  const targetLat = isPickingUp ? order.store?.lat : order.deliveryLat;
  const targetLng = isPickingUp ? order.store?.lng : order.deliveryLng;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/driver')} className="text-gray-500 hover:text-gray-700 text-sm font-semibold">
          ← Quay lại
        </button>
        <span className="text-xs text-gray-400 font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          {STATUS_STEPS.map((step, i) => {
            const isActive = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <div
                    className={`absolute top-5 -left-1/2 w-full h-0.5 ${
                      i <= currentStep ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                    isCurrent
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110'
                      : isActive
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.icon}
                </div>
                <p className={`text-xs mt-2 font-semibold ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Driver Map Route */}
      {driverPos && targetLat && targetLng && (
        <DriverRouteMap 
          driverLat={driverPos.lat} 
          driverLng={driverPos.lng} 
          targetLat={targetLat} 
          targetLng={targetLng} 
          targetType={isPickingUp ? 'STORE' : 'CUSTOMER'}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏪</span>
            <h3 className="font-bold text-gray-900">Quán</h3>
          </div>
          <p className="font-semibold text-gray-900">{order.store?.name}</p>
          <p className="text-sm text-gray-500 mt-1">{order.store?.address}</p>
          {order.store?.phone && (
            <a href={`tel:${order.store.phone}`} className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 font-semibold hover:underline">
              📞 {order.store.phone}
            </a>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📍</span>
            <h3 className="font-bold text-gray-900">Giao đến</h3>
          </div>
          <p className="font-semibold text-gray-900">{order.user?.name || 'Khách hàng'}</p>
          <p className="text-sm text-gray-500 mt-1">{order.deliveryAddress}</p>
          {order.deliveryPhone && (
            <a href={`tel:${order.deliveryPhone}`} className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 font-semibold hover:underline">
              📞 {order.deliveryPhone}
            </a>
          )}
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">📦 Chi tiết đơn hàng</h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-sm font-bold text-orange-500">
                    {item.quantity}x
                  </span>
                  <span className="text-sm text-gray-700">{item.product.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{fmt(item.price * item.quantity)}đ</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-500">Tổng đơn hàng</span>
          <span className="font-bold text-gray-900">{fmt(order.total)}đ</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-500">Phí giao hàng</span>
          <span className="font-bold text-orange-500">{fmt(order.shippingFee)}đ</span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <span className="font-bold text-gray-900">Thu khách ({order.paymentMethod})</span>
          <span className="text-xl font-bold text-gray-900">{fmt(order.total)}đ</span>
        </div>
      </div>

      {order.note && (
        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <span className="font-bold">📝 Ghi chú:</span> {order.note}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {order.status === 'PICKING_UP' && (
          <>
            <button
              onClick={handlePickedUp}
              disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-2xl hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {processing ? 'Đang xử lý...' : '📦 Đã lấy hàng — Bắt đầu giao'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="w-full py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Từ chối đơn
            </button>
          </>
        )}

        {order.status === 'DELIVERING' && (
          <button
            onClick={handleComplete}
            disabled={processing}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-2xl hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {processing ? 'Đang xử lý...' : '✅ Đã giao hàng thành công'}
          </button>
        )}

        {order.user && (
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-full py-3 border-2 border-orange-300 text-orange-600 font-semibold rounded-2xl hover:bg-orange-50 transition-colors"
          >
            💬 Chat với khách hàng
          </button>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Lý do từ chối đơn</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Quá xa, hết xăng, có việc gấp..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none resize-none h-24"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || processing}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {showChat && order.user && user && (
        <LiveChatWidget
          orderId={order.id}
          receiverId={order.user.id}
          receiverName={order.user.name}
          receiverRole="CUSTOMER"
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
