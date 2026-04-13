'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const GOONG_MAP_TILES_KEY = process.env.NEXT_PUBLIC_GOONG_MAP_TILES_KEY || '';
const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY || '';

interface DriverRouteMapProps {
  driverLat: number;
  driverLng: number;
  targetLat: number;
  targetLng: number;
  targetType: 'STORE' | 'CUSTOMER';
}

function decodePolyline(str: string, precision: number = 5) {
  let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null;
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    byte = null; shift = 0; result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    shift = result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += latitude_change;
    lng += longitude_change;
    coordinates.push([lng / factor, lat / factor]);
  }
  return coordinates;
}

export default function DriverRouteMap({ driverLat, driverLng, targetLat, targetLng, targetType }: DriverRouteMapProps) {
  const [routeGeoJson, setRouteGeoJson] = useState<any>(null);

  useEffect(() => {
    if (!driverLat || !driverLng || !targetLat || !targetLng) return;
    
    // Fetch directions from Goong
    const fetchRoute = async () => {
      try {
        const res = await fetch(`https://rsapi.goong.io/Direction?origin=${driverLat},${driverLng}&destination=${targetLat},${targetLng}&vehicle=bike&api_key=${GOONG_API_KEY}`);
        const data = await res.json();
        
        if (data && data.routes && data.routes.length > 0) {
          const polylineStr = data.routes[0].overview_polyline.points;
          const coordinates = decodePolyline(polylineStr, 5);
          
          setRouteGeoJson({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          });
        }
      } catch (error) {
        console.error('Lỗi khi tải đường đi Goong Maps:', error);
      }
    };

    fetchRoute();
  }, [driverLat, driverLng, targetLat, targetLng]);

  const mapStyleUrl = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAP_TILES_KEY}`;

  // Center is between driver and target
  const initialViewState = useMemo(() => {
    return {
      longitude: (driverLng + targetLng) / 2,
      latitude: (driverLat + targetLat) / 2,
      zoom: 13
    };
  }, [driverLat, driverLng, targetLat, targetLng]);

  return (
    <div className="w-full h-[400px] sm:h-[500px] mt-4 rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative">
      <Map
        initialViewState={initialViewState}
        mapStyle={mapStyleUrl}
        attributionControl={false}
      >
        {/* Lớp vẽ Đường đi */}
        {routeGeoJson && (
          <Source type="geojson" data={routeGeoJson}>
            {/* Outline mờ tạo hiệu ứng Neon */}
            <Layer 
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 12,
                'line-opacity': 0.3,
                'line-blur': 4
              }}
            />
            {/* Cốt đường đi nét */}
            <Layer 
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#2563eb',
                'line-width': 5
              }}
            />
          </Source>
        )}

        {/* Marker vị trí Tài Xế */}
        <Marker longitude={driverLng} latitude={driverLat} anchor="bottom">
          <div className="relative group">
            <div className="absolute -inset-4 bg-orange-500/20 rounded-full animate-ping"></div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-orange-500 text-2xl z-10 relative">
              🛵
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-orange-600"></div>
          </div>
        </Marker>

        {/* Marker Đích (Quán hoặc Khách) */}
        <Marker longitude={targetLng} latitude={targetLat} anchor="bottom">
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-2xl relative">
            {targetType === 'STORE' ? '🏪' : '📍'}
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-900"></div>
        </Marker>

      </Map>
    </div>
  );
}
