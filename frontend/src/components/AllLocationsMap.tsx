import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllBirdDetails } from '../hooks/useQueries';
import type { BirdData, LocationEntry } from '../backend';
import { MapPin, Eye, EyeOff, ArrowRight, Filter } from 'lucide-react';

interface MarkerData {
  birdName: string;
  arabicName: string;
  localName: string;
  scientificName: string;
  englishName: string;
  latitude: number;
  longitude: number;
  location: string;
  governorate: string;
  mountainName: string;
  valleyName: string;
  notes: string;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function AllLocationsMap() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [filterBird, setFilterBird] = useState('all');
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  const { data: birdDataRaw, isLoading } = useGetAllBirdDetails();

  const birdData: [string, BirdData][] = birdDataRaw || [];

  // Extract all markers
  const allMarkers: MarkerData[] = [];
  for (const [name, bird] of birdData) {
    for (const loc of bird.locations) {
      if (loc.coordinate.latitude !== 0 || loc.coordinate.longitude !== 0) {
        allMarkers.push({
          birdName: name,
          arabicName: bird.arabicName,
          localName: bird.localName,
          scientificName: bird.scientificName,
          englishName: bird.englishName,
          latitude: loc.coordinate.latitude,
          longitude: loc.coordinate.longitude,
          location: loc.location,
          governorate: loc.governorate,
          mountainName: loc.mountainName,
          valleyName: loc.valleyName,
          notes: loc.notes,
        });
      }
    }
  }

  const filteredMarkers =
    filterBird === 'all' ? allMarkers : allMarkers.filter((m) => m.birdName === filterBird);

  const birdNames = Array.from(new Set(allMarkers.map((m) => m.birdName)));

  // Load Leaflet
  useEffect(() => {
    if (typeof window.L !== 'undefined') {
      setIsMapReady(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setIsMapReady(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isMapReady || !mapRef.current || leafletMapRef.current) return;

    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [24.23, 56.12],
      zoom: 10,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;
  }, [isMapReady]);

  // Update markers
  useEffect(() => {
    if (!leafletMapRef.current || !isMapReady) return;

    const L = window.L;
    const map = leafletMapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (!showMarkers) return;

    const bounds: [number, number][] = [];

    filteredMarkers.forEach((markerData) => {
      const circleMarker = L.circleMarker([markerData.latitude, markerData.longitude], {
        radius: 8,
        fillColor: '#f59e0b',
        color: '#92400e',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      });

      const popupContent = `
        <div dir="rtl" style="font-family: Arial, sans-serif; min-width: 200px;">
          <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #92400e;">${markerData.arabicName}</h3>
          ${markerData.localName ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">الاسم المحلي: ${markerData.localName}</p>` : ''}
          ${markerData.scientificName ? `<p style="font-size: 12px; color: #666; margin: 2px 0; font-style: italic;">الاسم العلمي: ${markerData.scientificName}</p>` : ''}
          ${markerData.englishName ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">الاسم الإنجليزي: ${markerData.englishName}</p>` : ''}
          ${markerData.location ? `<p style="font-size: 12px; margin: 2px 0;">الموقع: ${markerData.location}</p>` : ''}
          ${markerData.governorate ? `<p style="font-size: 12px; margin: 2px 0;">المحافظة: ${markerData.governorate}</p>` : ''}
          ${markerData.mountainName ? `<p style="font-size: 12px; margin: 2px 0;">الجبل: ${markerData.mountainName}</p>` : ''}
          ${markerData.valleyName ? `<p style="font-size: 12px; margin: 2px 0;">الوادي: ${markerData.valleyName}</p>` : ''}
          <p style="font-size: 11px; color: #999; margin-top: 6px;">${markerData.latitude.toFixed(4)}, ${markerData.longitude.toFixed(4)}</p>
          ${markerData.notes ? `<p style="font-size: 12px; color: #555; margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px;">${markerData.notes}</p>` : ''}
        </div>
      `;

      circleMarker.bindPopup(popupContent);
      circleMarker.addTo(map);
      markersRef.current.push(circleMarker);
      bounds.push([markerData.latitude, markerData.longitude]);
    });

    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [30, 30] });
      } catch (e) {
        // ignore
      }
    }
  }, [isMapReady, filteredMarkers, showMarkers]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            الرئيسية
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">خريطة المواقع</h1>
            <p className="text-sm text-muted-foreground">{allMarkers.length} موقع رصد</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterBird}
                onChange={(e) => setFilterBird(e.target.value)}
                className="text-sm bg-card border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">جميع الطيور</option>
                {birdNames.map((name) => (
                  <option key={name} value={name}>
                    {birdData.find(([n]) => n === name)?.[1].arabicName || name}
                  </option>
                ))}
              </select>
            </div>

            {/* Show/Hide Toggle */}
            <button
              onClick={() => setShowMarkers(!showMarkers)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                showMarkers
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {showMarkers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showMarkers ? 'إخفاء المواقع' : 'إظهار المواقع'}
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="rounded-xl overflow-hidden border border-border shadow-md mb-6">
          {isLoading && (
            <div className="h-96 flex items-center justify-center bg-muted">
              <div className="text-center">
                <div className="text-4xl mb-3">🗺️</div>
                <p className="text-muted-foreground">جاري تحميل الخريطة...</p>
              </div>
            </div>
          )}
          <div
            ref={mapRef}
            style={{ height: '500px', width: '100%' }}
            className={isLoading ? 'hidden' : ''}
          />
        </div>

        {/* Locations Table */}
        {filteredMarkers.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-foreground">قائمة المواقع ({filteredMarkers.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-3 py-2 text-right font-medium text-foreground">#</th>
                    <th className="px-3 py-2 text-right font-medium text-foreground">الطائر</th>
                    <th className="px-3 py-2 text-right font-medium text-foreground">الموقع</th>
                    <th className="px-3 py-2 text-right font-medium text-foreground">المحافظة</th>
                    <th className="px-3 py-2 text-right font-medium text-foreground">الجبل</th>
                    <th className="px-3 py-2 text-right font-medium text-foreground">الوادي</th>
                    <th className="px-3 py-2 text-right font-medium text-foreground">الإحداثيات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarkers.map((marker, index) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{marker.arabicName}</td>
                      <td className="px-3 py-2 text-foreground">{marker.location || '-'}</td>
                      <td className="px-3 py-2 text-foreground">{marker.governorate || '-'}</td>
                      <td className="px-3 py-2 text-foreground">{marker.mountainName || '-'}</td>
                      <td className="px-3 py-2 text-foreground">{marker.valleyName || '-'}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
