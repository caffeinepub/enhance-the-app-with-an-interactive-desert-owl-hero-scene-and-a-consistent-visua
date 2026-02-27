import { useState, useEffect, useRef } from 'react';
import { useActor } from '../hooks/useActor';
import { LocationData } from '../backend';

declare global {
  interface Window {
    L: any;
  }
}

export default function AllLocationsMap() {
  const { actor, isFetching: actorFetching } = useActor();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [birdNames, setBirdNames] = useState<string[]>([]);
  const [selectedBird, setSelectedBird] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<any>(null);

  // Load Leaflet from CDN
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletLoaded(true);
    script.onerror = () => setError('فشل تحميل مكتبة الخريطة');
    document.head.appendChild(script);

    return () => {
      // cleanup not needed for CDN scripts
    };
  }, []);

  // Fetch all locations from backend
  useEffect(() => {
    if (!actor || actorFetching) return;

    const fetchLocations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await actor.getAllLocationsWithNames();
        setLocations(data);
        const names = Array.from(new Set(data.map((loc: LocationData) => loc.birdName)));
        setBirdNames(names);
      } catch (err) {
        setError('فشل تحميل بيانات المواقع');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [actor, actorFetching]);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !showMap || !mapContainerRef.current) return;
    if (mapRef.current) return; // already initialized

    const L = window.L;
    const map = L.map(mapContainerRef.current, {
      center: [23.5, 56.5],
      zoom: 8,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  }, [leafletLoaded, showMap]);

  // Update markers when locations or filter changes
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !window.L) return;

    const L = window.L;
    markersLayerRef.current.clearLayers();

    const filtered: LocationData[] = selectedBird === 'all'
      ? locations
      : locations.filter((loc: LocationData) => loc.birdName === selectedBird);

    if (filtered.length === 0) return;

    const bounds: [number, number][] = [];

    filtered.forEach((loc: LocationData) => {
      const { latitude, longitude } = loc.coordinate;
      if (
        typeof latitude !== 'number' || typeof longitude !== 'number' ||
        isNaN(latitude) || isNaN(longitude) ||
        latitude === 0 || longitude === 0
      ) return;

      const marker = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: '',
          html: `<div style="
            background: #d97706;
            border: 2px solid #92400e;
            border-radius: 50%;
            width: 14px;
            height: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.4);
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      });

      marker.bindPopup(`
        <div dir="rtl" style="font-family: 'Segoe UI', sans-serif; min-width: 120px;">
          <strong style="color: #92400e;">${loc.birdName}</strong><br/>
          <small style="color: #666;">
            خط العرض: ${latitude.toFixed(4)}<br/>
            خط الطول: ${longitude.toFixed(4)}
          </small>
        </div>
      `);

      markersLayerRef.current.addLayer(marker);
      bounds.push([latitude, longitude]);
    });

    if (bounds.length > 0) {
      try {
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch {
        // ignore fitBounds errors
      }
    }
  }, [locations, selectedBird, leafletLoaded]);

  // Reinitialize map when showMap toggles on
  useEffect(() => {
    if (!showMap) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
      }
    }
  }, [showMap]);

  const filteredLocations: LocationData[] = selectedBird === 'all'
    ? locations
    : locations.filter((loc: LocationData) => loc.birdName === selectedBird);

  const validLocations = filteredLocations.filter((loc: LocationData) => {
    const { latitude, longitude } = loc.coordinate;
    return (
      typeof latitude === 'number' && typeof longitude === 'number' &&
      !isNaN(latitude) && !isNaN(longitude) &&
      latitude !== 0 && longitude !== 0
    );
  });

  return (
    <div dir="rtl" className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-800 text-amber-50 py-4 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">🗺️ خريطة مواقع الطيور</h1>
            <p className="text-amber-200 text-sm mt-1">مشروع المسح الميداني لطائر البوم بمحافظة البريمي</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowMap(prev => !prev)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {showMap ? '🙈 إخفاء الخريطة' : '🗺️ إظهار الخريطة'}
            </button>
            <a
              href="/"
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🏠 العودة للرئيسية
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Filter & Stats Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 flex flex-wrap items-center gap-4 border border-amber-200">
          <div className="flex items-center gap-2">
            <label className="text-amber-800 font-medium text-sm">تصفية حسب الطائر:</label>
            <select
              value={selectedBird}
              onChange={e => setSelectedBird(e.target.value)}
              className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">الكل ({locations.length} موقع)</option>
              {birdNames.map((name: string) => {
                const count = locations.filter((l: LocationData) => l.birdName === name).length;
                return (
                  <option key={name} value={name}>
                    {name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex gap-4 text-sm text-amber-700 mr-auto">
            <span>📍 إجمالي المواقع: <strong>{locations.length}</strong></span>
            <span>🦅 عدد الطيور: <strong>{birdNames.length}</strong></span>
            {selectedBird !== 'all' && (
              <span>🔍 المواقع المعروضة: <strong>{validLocations.length}</strong></span>
            )}
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center border border-amber-200">
            <div className="text-amber-600 text-4xl mb-3 animate-spin inline-block">⏳</div>
            <p className="text-amber-700 font-medium">جاري تحميل بيانات المواقع...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => {
                if (actor) {
                  setIsLoading(true);
                  actor.getAllLocationsWithNames()
                    .then((data: LocationData[]) => {
                      setLocations(data);
                      setBirdNames(Array.from(new Set(data.map((l: LocationData) => l.birdName))));
                      setError(null);
                    })
                    .catch(() => setError('فشل تحميل بيانات المواقع'))
                    .finally(() => setIsLoading(false));
                }
              }}
              className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Map */}
        {showMap && !isLoading && !error && (
          <div className="bg-white rounded-xl shadow-md border border-amber-200 overflow-hidden">
            <div className="bg-amber-100 px-4 py-2 border-b border-amber-200 flex items-center gap-2">
              <span className="text-amber-800 font-medium text-sm">🗺️ الخريطة التفاعلية</span>
              {!leafletLoaded && (
                <span className="text-amber-600 text-xs">جاري تحميل الخريطة...</span>
              )}
            </div>
            {!leafletLoaded ? (
              <div className="h-96 flex items-center justify-center bg-amber-50">
                <div className="text-center">
                  <div className="text-4xl mb-3 animate-pulse">🗺️</div>
                  <p className="text-amber-700">جاري تحميل مكتبة الخريطة...</p>
                </div>
              </div>
            ) : (
              <div
                ref={mapContainerRef}
                style={{ height: '480px', width: '100%' }}
              />
            )}
          </div>
        )}

        {/* Locations List */}
        {!isLoading && !error && (
          <div className="bg-white rounded-xl shadow-md border border-amber-200 overflow-hidden">
            <div className="bg-amber-100 px-4 py-3 border-b border-amber-200">
              <h2 className="text-amber-800 font-bold text-sm">
                📋 قائمة المواقع
                {selectedBird !== 'all' && ` — ${selectedBird}`}
                <span className="mr-2 text-amber-600 font-normal">({validLocations.length} موقع)</span>
              </h2>
            </div>

            {validLocations.length === 0 ? (
              <div className="p-8 text-center text-amber-600">
                <div className="text-4xl mb-3">📭</div>
                <p>لا توجد مواقع مسجلة {selectedBird !== 'all' ? `لـ ${selectedBird}` : ''}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-amber-50 text-amber-800">
                    <tr>
                      <th className="px-4 py-2 text-right font-semibold border-b border-amber-200">#</th>
                      <th className="px-4 py-2 text-right font-semibold border-b border-amber-200">اسم الطائر</th>
                      <th className="px-4 py-2 text-right font-semibold border-b border-amber-200">خط العرض</th>
                      <th className="px-4 py-2 text-right font-semibold border-b border-amber-200">خط الطول</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validLocations.map((loc: LocationData, idx: number) => (
                      <tr
                        key={idx}
                        className="border-b border-amber-100 hover:bg-amber-50 transition-colors"
                      >
                        <td className="px-4 py-2 text-amber-600 font-mono">{idx + 1}</td>
                        <td className="px-4 py-2 text-amber-900 font-medium">{loc.birdName}</td>
                        <td className="px-4 py-2 text-amber-700 font-mono">{loc.coordinate.latitude.toFixed(6)}</td>
                        <td className="px-4 py-2 text-amber-700 font-mono">{loc.coordinate.longitude.toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Return to Home (bottom) */}
        <div className="text-center pb-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md"
          >
            🏠 العودة للرئيسية
          </a>
        </div>
      </main>
    </div>
  );
}
