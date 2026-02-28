import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetAllBirdDetails } from '../hooks/useQueries';
import { BirdData, LocationEntry } from '../backend';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, RefreshCw, Home, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

// Leaflet dynamic import
let L: any = null;

interface MarkerData {
  birdKey: string;
  bird: BirdData;
  location: LocationEntry;
  lat: number;
  lng: number;
}

export default function AllLocationsMap() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [mapReady, setMapReady] = useState(false);
  const [selectedBird, setSelectedBird] = useState<string>('all');
  const [showMarkers, setShowMarkers] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const { data: allBirds, isLoading, error, refetch } = useGetAllBirdDetails();

  // Extract all valid marker data
  const allMarkers: MarkerData[] = React.useMemo(() => {
    if (!allBirds) return [];
    const markers: MarkerData[] = [];
    for (const [key, bird] of allBirds) {
      if (!bird.locations) continue;
      for (const loc of bird.locations) {
        const lat = loc.coordinate?.latitude;
        const lng = loc.coordinate?.longitude;
        if (
          lat !== undefined && lng !== undefined &&
          !isNaN(lat) && !isNaN(lng) &&
          lat !== 0 && lng !== 0 &&
          lat >= -90 && lat <= 90 &&
          lng >= -180 && lng <= 180
        ) {
          markers.push({ birdKey: key, bird, location: loc, lat, lng });
        }
      }
    }
    return markers;
  }, [allBirds]);

  const filteredMarkers = React.useMemo(() => {
    if (selectedBird === 'all') return allMarkers;
    return allMarkers.filter(m => m.birdKey === selectedBird || m.bird.arabicName === selectedBird);
  }, [allMarkers, selectedBird]);

  const uniqueBirds = React.useMemo(() => {
    if (!allBirds) return [];
    return allBirds.filter(([, bird]) => bird.locations && bird.locations.length > 0);
  }, [allBirds]);

  // Load Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        if (!(window as any).L) {
          // Load CSS
          if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
          }
          // Load JS
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        L = (window as any).L;
        setLeafletLoaded(true);
      } catch (err) {
        console.error('Failed to load Leaflet:', err);
      }
    };
    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [23.5, 56.5],
      zoom: 8,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    leafletMapRef.current = map;
    setMapReady(true);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Update markers
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !L) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!showMarkers) return;

    const markers: any[] = [];

    filteredMarkers.forEach(({ bird, location, lat, lng }) => {
      const circleMarker = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: '#d97706',
        color: '#92400e',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      });

      const popupContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; min-width: 200px; padding: 4px;">
          <h3 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 8px 0; border-bottom: 2px solid #d97706; padding-bottom: 4px;">
            ${bird.arabicName || '—'}
          </h3>
          ${bird.localName ? `<p style="margin: 3px 0; color: #78350f;"><strong>الاسم المحلي:</strong> ${bird.localName}</p>` : ''}
          ${bird.scientificName ? `<p style="margin: 3px 0; color: #78350f; font-style: italic;"><strong>الاسم العلمي:</strong> ${bird.scientificName}</p>` : ''}
          ${bird.englishName ? `<p style="margin: 3px 0; color: #78350f;"><strong>الاسم الإنجليزي:</strong> ${bird.englishName}</p>` : ''}
          <hr style="border-color: #fde68a; margin: 6px 0;" />
          ${location.location ? `<p style="margin: 3px 0; color: #78350f;"><strong>الموقع:</strong> ${location.location}</p>` : ''}
          ${location.governorate ? `<p style="margin: 3px 0; color: #78350f;"><strong>المحافظة:</strong> ${location.governorate}</p>` : ''}
          ${location.mountainName ? `<p style="margin: 3px 0; color: #78350f;"><strong>الجبل:</strong> ${location.mountainName}</p>` : ''}
          ${location.valleyName ? `<p style="margin: 3px 0; color: #78350f;"><strong>الوادي:</strong> ${location.valleyName}</p>` : ''}
          <p style="margin: 3px 0; color: #78350f; font-size: 12px;">
            <strong>الإحداثيات:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </p>
          ${location.notes ? `<p style="margin: 6px 0 0 0; color: #92400e; font-size: 12px; background: #fef3c7; padding: 4px; border-radius: 4px;">${location.notes}</p>` : ''}
        </div>
      `;

      circleMarker.bindPopup(popupContent, { maxWidth: 280 });
      circleMarker.addTo(leafletMapRef.current);
      markers.push(circleMarker);
    });

    markersRef.current = markers;

    // Fit bounds if markers exist
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      try {
        leafletMapRef.current.fitBounds(group.getBounds().pad(0.1));
      } catch (e) {
        // ignore
      }
    }
  }, [mapReady, filteredMarkers, showMarkers]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    await queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
    refetch();
    toast.success('تم تحديث بيانات الخريطة');
  };

  return (
    <div className="min-h-screen bg-amber-50" dir="rtl">
      {/* Header */}
      <div className="bg-amber-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-amber-300" />
          <h1 className="text-xl font-bold">خريطة مواقع الطيور</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-amber-300 text-amber-100 hover:bg-amber-700 gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/' })}
            className="border-amber-300 text-amber-100 hover:bg-amber-700 gap-1"
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-amber-200 px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm">
        {/* Bird filter */}
        <div className="flex items-center gap-2">
          <label className="text-amber-800 font-semibold text-sm">تصفية حسب الطائر:</label>
          <select
            value={selectedBird}
            onChange={e => setSelectedBird(e.target.value)}
            className="border border-amber-300 rounded-md px-3 py-1.5 text-sm bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all">جميع الطيور ({allMarkers.length} موقع)</option>
            {uniqueBirds.map(([key, bird]) => (
              <option key={key} value={key}>
                {bird.arabicName} ({bird.locations.length} موقع)
              </option>
            ))}
          </select>
        </div>

        {/* Show/hide toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMarkers(v => !v)}
          className="border-amber-300 text-amber-700 hover:bg-amber-50 gap-1"
        >
          {showMarkers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showMarkers ? 'إخفاء المواقع' : 'إظهار المواقع'}
        </Button>

        {/* Stats */}
        <div className="text-sm text-amber-700 mr-auto">
          <span className="bg-amber-100 px-2 py-1 rounded-full">
            {filteredMarkers.length} موقع معروض
          </span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 gap-2 text-amber-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>جاري تحميل بيانات الخريطة...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-8 text-red-600 bg-red-50 m-4 rounded-lg border border-red-200">
          <p className="font-semibold">حدث خطأ في تحميل البيانات</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <div
          ref={mapRef}
          style={{ height: '60vh', minHeight: '400px', width: '100%' }}
          className="z-0"
        />
        {!leafletLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-amber-50 z-10">
            <div className="flex items-center gap-2 text-amber-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>جاري تحميل الخريطة...</span>
            </div>
          </div>
        )}
      </div>

      {/* Locations Table */}
      {!isLoading && allMarkers.length > 0 && (
        <div className="p-4">
          <h2 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            قائمة المواقع ({filteredMarkers.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-amber-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-amber-100">
                <tr>
                  <th className="text-right text-amber-800 font-bold px-3 py-2">#</th>
                  <th className="text-right text-amber-800 font-bold px-3 py-2">الطائر</th>
                  <th className="text-right text-amber-800 font-bold px-3 py-2">الموقع</th>
                  <th className="text-right text-amber-800 font-bold px-3 py-2">المحافظة</th>
                  <th className="text-right text-amber-800 font-bold px-3 py-2">الجبل</th>
                  <th className="text-right text-amber-800 font-bold px-3 py-2">الوادي</th>
                  <th className="text-right text-amber-800 font-bold px-3 py-2">الإحداثيات</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarkers.map((m, i) => (
                  <tr key={`${m.birdKey}-${i}`} className="border-b border-amber-100 hover:bg-amber-50">
                    <td className="px-3 py-2 text-amber-700">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold text-amber-900">{m.bird.arabicName}</td>
                    <td className="px-3 py-2 text-amber-700">{m.location.location || '—'}</td>
                    <td className="px-3 py-2 text-amber-700">{m.location.governorate || '—'}</td>
                    <td className="px-3 py-2 text-amber-700">{m.location.mountainName || '—'}</td>
                    <td className="px-3 py-2 text-amber-700">{m.location.valleyName || '—'}</td>
                    <td className="px-3 py-2 text-amber-600 text-xs font-mono">
                      {m.lat.toFixed(4)}, {m.lng.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && allMarkers.length === 0 && (
        <div className="text-center py-12 text-amber-600 m-4 bg-amber-50 rounded-lg border border-amber-200">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-lg">لا توجد مواقع مسجلة بعد</p>
          <p className="text-sm mt-1">أضف بيانات الطيور مع الإحداثيات لعرضها على الخريطة</p>
        </div>
      )}

      {/* Return button */}
      <div className="p-4 text-center">
        <Button
          onClick={() => navigate({ to: '/' })}
          className="bg-amber-700 hover:bg-amber-800 text-white gap-2"
        >
          <Home className="w-4 h-4" />
          العودة للرئيسية
        </Button>
      </div>
    </div>
  );
}
