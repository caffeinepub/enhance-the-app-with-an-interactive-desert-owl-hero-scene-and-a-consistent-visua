import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllLocationsWithNames } from '../hooks/useQueries';
import { LocationData } from '../backend';

// Leaflet types (loaded via CDN)
declare global {
  interface Window {
    L: any;
  }
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function loadLeaflet(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve();
      return;
    }

    // Load CSS
    const existingCss = document.getElementById('leaflet-css');
    if (!existingCss) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load JS
    const existingScript = document.getElementById('leaflet-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });
}

// Inner map component that manages the Leaflet map instance
function LeafletMap({
  locations,
  selectedBird,
}: {
  locations: LocationData[];
  selectedBird: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [leafletError, setLeafletError] = useState<string | null>(null);

  // Load Leaflet on mount
  useEffect(() => {
    loadLeaflet()
      .then(() => setLeafletReady(true))
      .catch((err: Error) => setLeafletError(err.message));
  }, []);

  // Initialize map once Leaflet is ready
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;

    // Fix default icon paths for Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, {
      center: [24.25, 55.79],
      zoom: 10,
      zoomControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, [leafletReady]);

  // Update markers when locations or filter changes
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    const L = window.L;
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    // Clear existing markers
    markersLayer.clearLayers();

    // Filter locations
    const filtered = locations.filter((loc: LocationData) => {
      if (selectedBird !== 'all' && loc.birdName !== selectedBird) return false;
      return isValidCoordinate(loc.coordinate.latitude, loc.coordinate.longitude);
    });

    if (filtered.length === 0) {
      // Default center: Al Buraimi
      map.setView([24.25, 55.79], 10);
      return;
    }

    const bounds: [number, number][] = [];

    filtered.forEach((loc: LocationData) => {
      const { latitude, longitude } = loc.coordinate;
      const marker = L.marker([latitude, longitude]);

      marker.bindPopup(`
        <div style="text-align:right; direction:rtl; font-family: sans-serif; min-width:120px;">
          <strong style="font-size:14px;">${loc.birdName}</strong><br/>
          <span style="font-size:11px; color:#666;">
            خط العرض: ${latitude.toFixed(5)}<br/>
            خط الطول: ${longitude.toFixed(5)}
          </span>
        </div>
      `);

      markersLayer.addLayer(marker);
      bounds.push([latitude, longitude]);
    });

    // Fit map to markers
    if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [leafletReady, locations, selectedBird]);

  if (leafletError) {
    return (
      <div className="flex items-center justify-center h-full bg-amber-50 rounded-xl border border-amber-200">
        <div className="text-center p-6">
          <p className="text-amber-800 font-semibold text-lg mb-2">تعذّر تحميل الخريطة</p>
          <p className="text-amber-600 text-sm">{leafletError}</p>
        </div>
      </div>
    );
  }

  if (!leafletReady) {
    return (
      <div className="flex items-center justify-center h-full bg-amber-50 rounded-xl border border-amber-200">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-400 border-t-transparent mx-auto mb-3" />
          <p className="text-amber-700 font-medium">جارٍ تحميل الخريطة…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%', borderRadius: '0.75rem', zIndex: 0 }}
    />
  );
}

export default function AllLocationsMap() {
  const navigate = useNavigate();
  const { data: rawLocations, isLoading, error, refetch } = useGetAllLocationsWithNames();

  const allLocations: LocationData[] = (rawLocations as LocationData[] | undefined) ?? [];

  const [selectedBird, setSelectedBird] = useState<string>('all');
  const [showMap, setShowMap] = useState<boolean>(true);

  // Derive unique bird names for the filter dropdown
  const birdNames: string[] = Array.from(
    new Set(allLocations.map((loc: LocationData) => loc.birdName))
  ).sort() as string[];

  // Filtered coordinates for the list view
  const filteredLocations: LocationData[] =
    selectedBird === 'all'
      ? allLocations
      : allLocations.filter((loc: LocationData) => loc.birdName === selectedBird);

  const validFilteredLocations: LocationData[] = filteredLocations.filter((loc: LocationData) =>
    isValidCoordinate(loc.coordinate.latitude, loc.coordinate.longitude)
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-sand-50" dir="rtl">
      {/* Header */}
      <header className="bg-amber-800 text-amber-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wide">🗺️ خريطة مواقع الطيور</h1>
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-amber-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <span>العودة للرئيسية</span>
            <span>🏠</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-md border border-amber-100 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Bird filter */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <label className="text-amber-800 font-semibold text-sm whitespace-nowrap">
                تصفية حسب الطائر:
              </label>
              <select
                value={selectedBird}
                onChange={(e) => setSelectedBird(e.target.value)}
                className="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-sm bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">جميع الطيور</option>
                {birdNames.map((name: string) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle map visibility */}
            <button
              onClick={() => setShowMap((v) => !v)}
              className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-amber-300"
            >
              <span>{showMap ? '🙈' : '👁️'}</span>
              <span>{showMap ? 'إخفاء الخريطة' : 'إظهار الخريطة'}</span>
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <span className={isLoading ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
              <span>تحديث</span>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-amber-700">
            <span className="bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              إجمالي المواقع: <strong>{allLocations.length}</strong>
            </span>
            <span className="bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              المواقع المعروضة: <strong>{validFilteredLocations.length}</strong>
            </span>
            <span className="bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              عدد الطيور: <strong>{birdNames.length}</strong>
            </span>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 font-semibold">حدث خطأ أثناء تحميل البيانات</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-red-600 underline text-sm hover:text-red-800"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-400 border-t-transparent mx-auto mb-2" />
            <p className="text-amber-700">جارٍ تحميل بيانات المواقع…</p>
          </div>
        )}

        {/* Interactive Map */}
        {showMap && !isLoading && (
          <div
            className="bg-white rounded-xl shadow-md border border-amber-100 overflow-hidden"
            style={{ height: '500px' }}
          >
            <LeafletMap locations={allLocations} selectedBird={selectedBird} />
          </div>
        )}

        {/* Locations list */}
        {validFilteredLocations.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-amber-100 p-4">
            <h2 className="text-amber-800 font-bold text-lg mb-4 border-b border-amber-100 pb-2">
              قائمة المواقع ({validFilteredLocations.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {validFilteredLocations.map((loc: LocationData, idx: number) => (
                <div
                  key={idx}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm"
                >
                  <p className="font-semibold text-amber-900 mb-1">{loc.birdName}</p>
                  <p className="text-amber-700 text-xs">
                    خط العرض: {loc.coordinate.latitude.toFixed(5)}
                  </p>
                  <p className="text-amber-700 text-xs">
                    خط الطول: {loc.coordinate.longitude.toFixed(5)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && validFilteredLocations.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <p className="text-amber-700 text-lg font-medium">
              {selectedBird === 'all'
                ? 'لا توجد مواقع مسجّلة حتى الآن'
                : `لا توجد مواقع مسجّلة للطائر: ${selectedBird}`}
            </p>
          </div>
        )}

        {/* Return to home button (bottom) */}
        <div className="text-center pb-4">
          <button
            onClick={() => navigate({ to: '/' })}
            className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-6 py-3 rounded-xl transition-colors font-medium shadow"
          >
            <span>🏠</span>
            <span>العودة للرئيسية</span>
          </button>
        </div>
      </main>
    </div>
  );
}
