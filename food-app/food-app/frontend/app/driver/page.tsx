'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { fetchAvailableOrders, acceptOrder, completeOrder, fetchDriverMyOrders, DriverOrder } from '@/lib/api/client';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function DriverDashboard() {
  const { user, token } = useAuthStore();
  const [availableOrders, setAvailableOrders] = useState<DriverOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<DriverOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token || user?.role !== 'DRIVER') return;
    loadOrders();

    // Connect to WebSocket to receive 'order-prepared' event
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('order-prepared', (data) => {
      console.log('New Order Built:', data);
      loadOrders(); // Refresh available orders list
    });

    return () => {
      socket.disconnect();
      stopBroadcastingLocation();
    };
  }, [token, user]);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [available, myOrders] = await Promise.all([
        fetchAvailableOrders(token),
        fetchDriverMyOrders(token)
      ]);
      setAvailableOrders(available);
      
      const currentActive = myOrders.find(o => o.status === 'DELIVERING');
      setActiveOrder(currentActive || null);
      
      if (currentActive) {
         startBroadcastingLocation(currentActive);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!token) return;
    try {
      const order = await acceptOrder(orderId, token);
      setActiveOrder(order);
      // Automatically start watching and broadcasting location map tracking updates
      startBroadcastingLocation(order);
      // Refetch available
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (e) {
      alert('Lỗi nhận đơn: ' + e);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (!token) return;
    try {
      await completeOrder(orderId, token);
      setActiveOrder(null);
      stopBroadcastingLocation();
      alert('Giao hàng thành công! Hoan hô!');
    } catch (e) {
      alert('Lỗi hoàn thành đơn: ' + e);
    }
  };

  const startBroadcastingLocation = (order: DriverOrder) => {
    if (!navigator.geolocation || watchIdRef.current) return;
    
    setIsBroadcasting(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`📡 Phát sóng GPS: ${latitude}, ${longitude}`);
        if (socketRef.current) {
          socketRef.current.emit('update-driver-location', {
            orderId: order.id,
            customerId: order.user?.id || order.userId, // We need customerId, wait, does DriverOrder have userId? Yes, let me double check payload.
            lat: latitude,
            lng: longitude
          });
        }
      },
      (error) => {
        console.error('Lỗi lấy GPS:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopBroadcastingLocation = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsBroadcasting(false);
  };

  if (!user || user.role !== 'DRIVER') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-xl">Vui lòng đăng nhập bằng tài khoản Tài Xế</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <span>🛵</span> Chào Shipper, {user.name}
            </h1>
            <p className="text-gray-300 text-sm mt-1">Đã sẵn sàng nhận cuốc xe hôm nay chưa?</p>
          </div>
          {isBroadcasting && (
             <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full border border-green-500/30">
               <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
               </span>
               <span className="text-xs font-bold">Đang phát GPS...</span>
             </div>
          )}
        </div>

        {/* ACTIVE ORDER */}
        {activeOrder && (
          <section className="bg-white border-2 border-primary rounded-3xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-4 py-2 rounded-bl-2xl">
                ĐƠN ĐANG GIAO
             </div>
             <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng hiện tại</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Người nhận</p>
                  <p className="font-bold text-lg">{activeOrder.user?.name || 'Khách'}</p>
                  <p className="text-gray-700">{activeOrder.deliveryPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Giao đến</p>
                  <p className="font-bold text-gray-900">{activeOrder.deliveryAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lấy từ Quán</p>
                  <p className="font-bold text-gray-900">{activeOrder.store?.name}</p>
                  <p className="text-gray-700">{activeOrder.store?.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Thu hộ (COD)</p>
                  <p className="font-extrabold text-primary text-xl">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activeOrder.total + activeOrder.shippingFee)}
                  </p>
                </div>
             </div>

             <div className="mt-6 flex justify-end">
               <button 
                 onClick={() => handleCompleteOrder(activeOrder.id)}
                 className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform active:scale-95"
               >
                 Đã giao xong ✅
               </button>
             </div>
          </section>
        )}

        {/* AVAILABLE ORDERS */}
        {!activeOrder && (
          <section>
             <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn mới quanh đây ({availableOrders.length})</h2>
             
             {loading ? (
                <div className="text-center py-10 text-gray-500">Đang tải...</div>
             ) : availableOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
                  <span className="text-5xl grayscale opacity-50 block mb-4">😴</span>
                  <p className="font-bold text-gray-700">Chưa có đơn hàng nào chờ giao.</p>
                </div>
             ) : (
                <div className="grid gap-4">
                  {availableOrders.map(order => (
                     <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">MỚI</span>
                             <span className="text-gray-400 text-sm">#{order.id.split('-')[0]}</span>
                          </div>
                          <p className="font-bold text-gray-900 flex items-center gap-1">
                            🏪 {order.store?.name}
                          </p>
                          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                            📍 {order.deliveryAddress}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                           <p className="text-lg font-extrabold text-primary">
                             {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shippingFee)}
                             <span className="text-xs text-gray-500 font-normal ml-1">phí ship</span>
                           </p>
                           <button 
                             onClick={() => handleAcceptOrder(order.id)}
                             className="bg-gray-900 hover:bg-black text-white font-bold py-2 px-6 rounded-xl transition-transform active:scale-95"
                           >
                             Nhận đơn
                           </button>
                        </div>
                     </div>
                  ))}
                </div>
             )}
          </section>
        )}
      </div>
    </main>
  );
}
