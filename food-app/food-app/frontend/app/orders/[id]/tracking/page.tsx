'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { fetchOrderById, Order } from '@/lib/api/client';
import { io, Socket } from 'socket.io-client';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const MAP_KEY = process.env.NEXT_PUBLIC_GOONG_MAP_TILES_KEY || 'your_goong_tiles_key_here';

export default function TrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Driver Location State
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    
    // Fetch Order details
    fetchOrderById(orderId, token)
      .then((data) => {
        setOrder(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

  }, [orderId, token]);

  useEffect(() => {
    if (!user || !token) return;

    // Connect to WebSockets
    const socket: Socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to real-time tracking for order', orderId);
    });

    // Listen for driver updates
    socket.on('driver-location-updated', (data: { orderId: string, lat: number, lng: number }) => {
      if (data.orderId === orderId) {
        console.log('🛵 Driver moved:', data);
        setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, token, orderId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-5xl animate-pulse inline-block">📡</span>
          <p className="mt-3 text-sm text-gray-500">Đang thiết lập kết nối định vị...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <span className="text-5xl">😵</span>
        <p className="mt-4 text-lg font-semibold text-gray-700">{error || 'Không tìm thấy đơn hàng'}</p>
        <Link href="/orders" className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-600">
          Quay lại Đơn hàng của tôi
        </Link>
      </main>
    );
  }

  return (
    <main className="h-screen w-full flex flex-col bg-gray-100 overflow-hidden relative">
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md shadow-sm px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Trở về
        </button>
        <div className="text-center">
          <h1 className="text-lg font-extrabold text-gray-900">Theo Dõi Đơn Hàng</h1>
          <p className="text-xs text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="w-20"></div> {/* Spacer */}
      </div>

      {/* MAP VIEW */}
      <div className="flex-1 w-full bg-gray-200">
        <Map
          initialViewState={{
            longitude: driverLocation?.lng || 106.6280, // Defaults to An Khanh, Hai Phong
            latitude: driverLocation?.lat || 20.8710,
            zoom: 15
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={`https://tiles.goong.io/assets/goong_map_web.json?api_key=${MAP_KEY}`}
        >
          <NavigationControl position="bottom-right" />
          
          {driverLocation && (
            <Marker longitude={driverLocation.lng} latitude={driverLocation.lat} anchor="bottom">
              <div className="relative group perspective-1000">
                <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
                <div className="bg-white rounded-full p-2 shadow-xl border-2 border-primary flex items-center justify-center transform transition-transform duration-300">
                  <span className="text-2xl drop-shadow-md">🛵</span>
                </div>
                <div className="absolute bottom-full mb-2 -translate-x-1/2 left-1/2 w-max px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded shadow shadow-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  Tài xế đang giao
                </div>
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {/* ORDER INFO BOTTOM CARD */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Trạng thái</p>
              <h3 className="text-lg font-extrabold text-primary">{formatStatus(order.status)}</h3>
            </div>
            {driverLocation ? (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full ring-1 ring-green-600/20">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold">Đang cập nhật GPS</span>
              </div>
            ) : (
              <div className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full text-xs font-bold">
                Chờ tín hiệu...
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
               👤
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">{order.driver?.name || 'Tài xế ShopeeFood'}</h4>
              <p className="text-sm text-gray-500">{order.driver?.phone || 'Đang chờ phân công'}</p>
            </div>
            <div className="flex gap-2">
               <button className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                 📞
               </button>
               <button className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                 💬
               </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    PREPARING: 'Đang nấu',
    PREPARED: 'Chờ tài xế lấy',
    DELIVERING: 'Tài xế đang giao',
    DELIVERED: 'Đã giao tới bạn',
    CANCELLED: 'Đã hủy',
  };
  return map[status] || status;
}
