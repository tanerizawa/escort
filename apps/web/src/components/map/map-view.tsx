'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPin } from 'lucide-react';

// Fix default marker icons for Leaflet in Next.js
const fixIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src,
    iconUrl: markerIcon.src,
    shadowUrl: markerShadow.src,
  });
};

interface MapViewProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  label?: string;
  className?: string;
  draggable?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
}

function MapViewInner({
  latitude,
  longitude,
  zoom = 15,
  label,
  className = 'h-64 w-full rounded-lg',
  draggable = false,
  onLocationChange,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fixIcon();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    // Initialize map if not yet created
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([latitude, longitude], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);

      const marker = L.marker([latitude, longitude], { draggable }).addTo(mapRef.current);
      if (label) {
        marker.bindPopup(label).openPopup();
      }
      markerRef.current = marker;

      if (draggable && onLocationChange) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onLocationChange(pos.lat, pos.lng);
        });
      }
    } else {
      // Update existing map
      mapRef.current.setView([latitude, longitude], zoom);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
        if (label) {
          markerRef.current.bindPopup(label);
        }
      }
    }

    return () => {
      // Cleanup on unmount
    };
  }, [mounted, latitude, longitude, zoom, label, draggable, onLocationChange]);

  // Cleanup map on component unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => Promise.resolve(MapViewInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-lg bg-dark-800">
      <div className="text-gray-400">Memuat peta...</div>
    </div>
  ),
});

export default MapView;

// ───── Location Picker Component ─────────────────────

interface LocationPickerProps {
  value?: { lat: number; lng: number };
  onChange?: (location: { lat: number; lng: number; address?: string }) => void;
  className?: string;
}

function LocationPickerInner({ value, onChange, className }: LocationPickerProps) {
  const [position, setPosition] = useState(
    value || { lat: -6.2088, lng: 106.8456 }, // Default: Jakarta
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleLocationChange = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    onChange?.({ lat, lng });
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);

    try {
      const res = await fetch(`/geocode?q=${encodeURIComponent(searchQuery)}&limit=1`);
      if (!res.ok) {
        throw new Error(`Geocoding request failed: ${res.status}`);
      }
      const data = await res.json();

      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition({ lat, lng });
        onChange?.({ lat, lng, address: data[0].display_name });
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });
        onChange?.({ lat, lng });
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className={className}>
      {/* Search bar */}
      <div className="mb-2 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
          placeholder="Cari lokasi..."
          className="flex-1 rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-400 focus:outline-none"
        />
        <button
          onClick={searchLocation}
          disabled={searching}
          className="rounded-lg bg-brand-400 px-3 py-2 text-sm font-medium text-dark-900 hover:bg-brand-300 disabled:opacity-50"
        >
          {searching ? '...' : 'Cari'}
        </button>
        <button
          onClick={getCurrentLocation}
          className="rounded-lg border border-dark-600 px-3 py-2 text-sm text-gray-300 hover:bg-dark-700"
          title="Gunakan lokasi saya"
        >
          <MapPin className="h-4 w-4 inline-block" />
        </button>
      </div>

      {/* Map */}
      <MapView
        latitude={position.lat}
        longitude={position.lng}
        draggable={true}
        onLocationChange={handleLocationChange}
        className="h-64 w-full rounded-lg"
      />

      {/* Coordinates display */}
      <div className="mt-1 text-xs text-gray-500">
        {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
      </div>
    </div>
  );
}

export const LocationPicker = dynamic(() => Promise.resolve(LocationPickerInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 w-full items-center justify-center rounded-lg bg-dark-800">
      <div className="text-gray-400">Memuat peta...</div>
    </div>
  ),
});
