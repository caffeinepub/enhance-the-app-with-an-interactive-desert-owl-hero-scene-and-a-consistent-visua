import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Home, X, MapPin } from 'lucide-react';
import { useAllLocationsWithNames, useGetAllBirdData } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';

// Al Buraimi approximate bounding box
const MAP_BOUNDS = {
  minLat: 23.9,
  maxLat: 24.4,
  minLng: 55.7,
  maxLng: 56.2,
};

function coordToPercent(lat: number, lng: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

interface BirdImageThumbProps {
  path: string;
  alt: string;
}

function BirdImageThumb({ path, alt }: BirdImageThumbProps) {
  const { data: url } = useFileUrl(path);
  if (!url) return <div className="w-full h-full bg-muted flex items-center justify-center"><span>🦉</span></div>;
  return <img src={url} alt={alt} className="w-full h-full object-cover" />;
}

export default function AllLocationsMap() {
  const navigate = useNavigate();
  const { data: locations, isLoading } = useAllLocationsWithNames();
  const { data: birdData } = useGetAllBirdData();
  const [selectedBird, setSelectedBird] = useState<string | null>(null);

  const selectedBirdData = birdData?.find(([name]) => name === selectedBird)?.[1];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-arabic text-sm"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
          <h1 className="text-xl font-bold text-foreground font-arabic">خريطة مواقع الانتشار</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-foreground/60 font-arabic">جاري تحميل الخريطة...</p>
          </div>
        )}

        {!isLoading && (
          <div className="relative">
            {/* Map Container */}
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg">
              <img
                src="/assets/generated/al-buraimi-official-static-map.dim_1024x768.png"
                alt="خريطة محافظة البريمي"
                className="w-full h-auto"
              />

              {/* Location Pins */}
              {locations?.map((loc, idx) => {
                const { x, y } = coordToPercent(loc.coordinate.latitude, loc.coordinate.longitude);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedBird(loc.birdName === selectedBird ? null : loc.birdName)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={loc.birdName}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-125 ${
                      selectedBird === loc.birdName ? 'bg-primary scale-125' : 'bg-destructive'
                    }`}>
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    <div className="absolute bottom-full mb-1 right-1/2 translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-arabic pointer-events-none">
                      {loc.birdName}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-sm font-arabic text-foreground/70">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-destructive border-2 border-white shadow" />
                <span>موقع رصد</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />
                <span>محدد</span>
              </div>
              <span className="mr-auto">إجمالي المواقع: {locations?.length ?? 0}</span>
            </div>
          </div>
        )}

        {/* Bird Detail Popup */}
        {selectedBird && selectedBirdData && (
          <div className="mt-6 bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground font-arabic">{selectedBirdData.arabicName}</h2>
              <button
                onClick={() => setSelectedBird(null)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedBirdData.subImages && selectedBirdData.subImages.length > 0 && (
              <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
                {selectedBirdData.subImages.map((imgPath, idx) => (
                  <div key={idx} className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-muted">
                    <BirdImageThumb path={imgPath} alt={`${selectedBirdData.arabicName} ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}

            {selectedBirdData.description && (
              <p className="text-foreground/70 font-arabic text-sm mb-4">{selectedBirdData.description}</p>
            )}

            <button
              onClick={() => navigate({ to: '/bird/$name', params: { name: selectedBird } })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-arabic hover:bg-primary/90 transition-colors"
            >
              عرض التفاصيل الكاملة
            </button>
          </div>
        )}

        {/* Return to Home */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate({ to: '/' })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-arabic font-semibold hover:bg-primary/90 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>العودة إلى الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
}
