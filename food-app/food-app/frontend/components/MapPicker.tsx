'use client';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix leaflet icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ lat, lng, onLocationChange }: { lat?: number, lng?: number, onLocationChange: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 15);
    }
  }, [lat, lng, map]);

  return lat && lng ? (
    <Marker position={[lat, lng]}></Marker>
  ) : null;
}

interface MapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onLocationChange }: MapPickerProps) {
  // Center Vietnam by default
  const defaultPos: [number, number] = [14.0583, 108.2772];
  const center: [number, number] = (lat && lng) ? [lat, lng] : defaultPos;
  const zoom = (lat && lng) ? 15 : 5;

  return (
    <div className="relative border border-gray-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: '300px', width: '100%', zIndex: 0 }}>
      {/* We set zIndex to 0 to prevent Map overlapping Modals in Next.js */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker lat={lat ?? undefined} lng={lng ?? undefined} onLocationChange={onLocationChange} />
        </MapContainer>
      </div>
    </div>
  );
}
