import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useGetAllLocationsWithNames, useGetBirdNames } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';

interface Pin {
  birdName: string;
  x: number;
  y: number;
}

// Al Buraimi approximate bounding box
const MAP_BOUNDS = {
  minLat: 23.5,
  maxLat: 24.5,
  minLng: 55.5,
  maxLng: 56.5,
};

function coordToPercent(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(2, Math.min(98, y)),
  };
}

function BirdThumbnail({ birdName }: { birdName: string }) {
  const { data: url } = useFileUrl(`birds/${birdName}/main.jpg`);
  if (!url) return <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-2xl">🦅</div>;
  return <img src={url} alt={birdName} className="w-12 h-12 object-cover rounded-lg" />;
}

export default function AllLocationsMap() {
  const { data: locations, isLoading } = useGetAllLocationsWithNames();
  const { data: birdNames } = useGetBirdNames();
  const [showMap, setShowMap] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const filteredLocations = (locations || []).filter((loc) => {
    if (selectedFilter === 'all') return true;
    return loc.birdName === selectedFilter;
  });

  const pins: Pin[] = filteredLocations.map((loc) => {
    const { x, y } = coordToPercent(loc.coordinate.latitude, loc.coordinate.longitude);
    return { birdName: loc.birdName, x, y };
  });

  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">خريطة مواقع الطيور</h1>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            <span>←</span>
            <span>الرئيسية</span>
          </Link>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => setShowMap(!showMap)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {showMap ? '🙈 إخفاء الخريطة' : '🗺️ إظهار الخريطة'}
          </button>

          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">جميع الطيور</option>
            {(birdNames || []).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <span className="text-sm text-muted-foreground">
            {pins.length} موقع
          </span>
        </div>

        {/* Map */}
        {showMap && (
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg bg-muted" style={{ minHeight: '400px' }}>

            {/* Pins */}
            {pins.map((pin, index) => (
              <button
                key={`${pin.birdName}-${index}`}
                onClick={() => setSelectedPin(selectedPin?.birdName === pin.birdName && selectedPin?.x === pin.x ? null : pin)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform z-10"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                title={pin.birdName}
              >
                <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <span className="text-xs text-primary-foreground">🐦</span>
                </div>
              </button>
            ))}

            {/* Selected Pin Popup */}
            {selectedPin && (
              <div
                className="absolute z-20 bg-card border border-border rounded-xl shadow-xl p-3 min-w-[160px]"
                style={{
                  left: `${Math.min(selectedPin.x, 75)}%`,
                  top: `${Math.max(selectedPin.y - 20, 5)}%`,
                }}
              >
                <button
                  onClick={() => setSelectedPin(null)}
                  className="absolute top-1 left-1 text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2 mt-1">
                  <BirdThumbnail birdName={selectedPin.birdName} />
                  <div>
                    <p className="font-bold text-foreground text-sm">{selectedPin.birdName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPin.x.toFixed(1)}%, {selectedPin.y.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        )}

        {/* Locations List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-4">قائمة المواقع</h2>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد مواقع متاحة</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLocations.map((loc, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-4">
                  <p className="font-bold text-foreground mb-1">{loc.birdName}</p>
                  <p className="text-xs text-muted-foreground">
                    خط العرض: {loc.coordinate.latitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    خط الطول: {loc.coordinate.longitude.toFixed(4)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Return */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
          >
            <span>←</span>
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
