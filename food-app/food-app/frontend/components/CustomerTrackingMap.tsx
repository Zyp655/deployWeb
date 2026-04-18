'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const GOONG_MAP_TILES_KEY = process.env.NEXT_PUBLIC_GOONG_MAP_TILES_KEY || '';
const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY || '';

interface DriverInfo {
  name: string;
  phone?: string | null;
  vehiclePlate?: string;
  vehicleType?: string;
  rating?: number;
}

interface CustomerTrackingMapProps {
  driverLat: number;
  driverLng: number;
  customerLat: number;
  customerLng: number;
  orderStatus: 'PICKING_UP' | 'DELIVERING';
  driverInfo?: DriverInfo | null;
  orderId: string;
  orderTotal: number;
  paymentMethod?: string;
  onCallDriver?: () => void;
  onChatDriver?: () => void;
}

function decodePolyline(str: string, precision: number = 5) {
  let index = 0, lat = 0, lng = 0;
  const coordinates: [number, number][] = [];
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    let shift = 0, result = 0, byte: number;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
    shift = result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
    coordinates.push([lng / factor, lat / factor]);
  }
  return coordinates;
}

function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function CustomerTrackingMap({
  driverLat,
  driverLng,
  customerLat,
  customerLng,
  orderStatus,
  driverInfo,
  orderId,
  orderTotal,
  paymentMethod,
  onCallDriver,
  onChatDriver,
}: CustomerTrackingMapProps) {
  const [routeGeoJson, setRouteGeoJson] = useState<any>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [smoothDriverPos, setSmoothDriverPos] = useState({ lat: driverLat, lng: driverLng });
  const [isArriving, setIsArriving] = useState(false);
  const lastFetchRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const straightDistance = useMemo(
    () => calculateHaversineDistance(driverLat, driverLng, customerLat, customerLng),
    [driverLat, driverLng, customerLat, customerLng]
  );

  useEffect(() => {
    setIsArriving(straightDistance < 200);
  }, [straightDistance]);

  useEffect(() => {
    const targetLat = driverLat;
    const targetLng = driverLng;
    const startLat = smoothDriverPos.lat;
    const startLng = smoothDriverPos.lng;
    const startTime = performance.now();
    const animDuration = 1000;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / animDuration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setSmoothDriverPos({
        lat: startLat + (targetLat - startLat) * ease,
        lng: startLng + (targetLng - startLng) * ease,
      });
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [driverLat, driverLng]);

  const fetchRoute = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 10000) return;
    lastFetchRef.current = now;

    try {
      const res = await fetch(
        `https://rsapi.goong.io/Direction?origin=${driverLat},${driverLng}&destination=${customerLat},${customerLng}&vehicle=bike&api_key=${GOONG_API_KEY}`
      );
      const data = await res.json();

      if (data?.routes?.length > 0) {
        const route = data.routes[0];
        const polylineStr = route.overview_polyline.points;
        const coordinates = decodePolyline(polylineStr, 5);

        setRouteGeoJson({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates },
        });

        if (route.legs?.[0]) {
          setDuration(Math.ceil(route.legs[0].duration.value / 60));
          setDistance(Math.round(route.legs[0].distance.value));
        }
      }
    } catch (err) {
      console.error('Route fetch error:', err);
    }
  }, [driverLat, driverLng, customerLat, customerLng]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  const mapStyleUrl = `https://tiles.goong.io/assets/goong_map_dark.json?api_key=${GOONG_MAP_TILES_KEY}`;

  const initialViewState = useMemo(() => ({
    longitude: (driverLng + customerLng) / 2,
    latitude: (driverLat + customerLat) / 2,
    zoom: 14,
  }), []);

  const etaText = duration ? `${duration} phút` : '...';
  const distanceText = distance ? (distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance} m`) : '';

  const progressPercent = useMemo(() => {
    if (!distance) return 0;
    const maxDist = 5000;
    return Math.min(100, Math.max(5, ((maxDist - distance) / maxDist) * 100));
  }, [distance]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#0b1326' }}>
      {/* Map Section */}
      <div className="relative w-full h-[320px] sm:h-[400px]">
        <Map
          initialViewState={initialViewState}
          mapStyle={mapStyleUrl}
          attributionControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          {routeGeoJson && (
            <Source type="geojson" data={routeGeoJson}>
              <Layer
                type="line"
                paint={{
                  'line-color': '#60a5fa',
                  'line-width': 14,
                  'line-opacity': 0.2,
                  'line-blur': 6,
                }}
              />
              <Layer
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#3b82f6',
                  'line-width': 5,
                }}
              />
            </Source>
          )}

          <Marker longitude={smoothDriverPos.lng} latitude={smoothDriverPos.lat} anchor="center">
            <div className="relative">
              <div className="absolute -inset-5 bg-orange-500/25 rounded-full animate-ping" />
              <div className="absolute -inset-3 bg-orange-500/15 rounded-full animate-pulse" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40 text-2xl z-10 border-2 border-white/30">
                🛵
              </div>
            </div>
          </Marker>

          <Marker longitude={customerLng} latitude={customerLat} anchor="bottom">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg text-2xl border-2 border-white/30">
                📍
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500" />
            </div>
          </Marker>
        </Map>

        {/* ETA Floating Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-xl backdrop-blur-md flex items-center gap-2 ${
            isArriving
              ? 'bg-green-500/90 text-white animate-pulse'
              : 'bg-gray-900/80 text-white border border-white/10'
          }`}>
            {isArriving ? (
              <>🎊 Sắp đến!</>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                ~{etaText}
              </>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800/50">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-1000 ease-out rounded-r-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Arriving Alert Banner */}
      {isArriving && (
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm animate-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl animate-bounce">
              🎊
            </div>
            <div>
              <p className="font-bold text-green-400 text-sm">Tài xế sắp đến nơi!</p>
              <p className="text-xs text-green-400/70">Hãy chuẩn bị nhận hàng</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info Panel */}
      <div className="p-4 space-y-4 pb-6">
        {/* Driver Info Card */}
        {driverInfo && (
          <div className="p-4 rounded-2xl bg-white/[0.05] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-orange-500/30">
                  {driverInfo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{driverInfo.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    {driverInfo.rating && <span>⭐ {driverInfo.rating.toFixed(1)}</span>}
                    {driverInfo.vehiclePlate && <span>🏍️ {driverInfo.vehiclePlate}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {onCallDriver && (
                  <button
                    onClick={onCallDriver}
                    className="w-10 h-10 rounded-full bg-green-500/20 hover:bg-green-500/30 flex items-center justify-center text-lg transition-colors"
                  >
                    📞
                  </button>
                )}
                {onChatDriver && (
                  <button
                    onClick={onChatDriver}
                    className="w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center text-lg transition-colors"
                  >
                    💬
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status + ETA */}
        <div className="p-4 rounded-2xl bg-white/[0.05] backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{orderStatus === 'PICKING_UP' ? '🏪' : '🛵'}</span>
              <p className="text-sm text-gray-300 font-medium">
                {orderStatus === 'PICKING_UP'
                  ? 'Tài xế đang đến quán lấy hàng...'
                  : 'Tài xế đang trên đường giao hàng...'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Dự kiến</span>
            <span className="text-orange-400 font-bold">~{etaText} {distanceText && `• ${distanceText}`}</span>
          </div>

          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Order Mini Summary */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>📋</span>
            <span>#{orderId.slice(0, 8).toUpperCase()}</span>
            {paymentMethod && (
              <>
                <span className="text-gray-700">•</span>
                <span>{paymentMethod === 'COD' ? '💵 COD' : paymentMethod === 'SEPAY' ? '🏦 VietQR' : '🔴 VNPay'}</span>
              </>
            )}
          </div>
          <span className="text-orange-400 font-bold text-sm">{formatPrice(orderTotal)}</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {onCallDriver && (
            <button
              onClick={onCallDriver}
              className="py-3 rounded-xl bg-green-500/15 hover:bg-green-500/25 text-green-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              📞 Gọi tài xế
            </button>
          )}
          {onChatDriver && (
            <button
              onClick={onChatDriver}
              className="py-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              💬 Nhắn tin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
