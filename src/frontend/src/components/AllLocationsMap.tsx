import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, Camera, Eye, EyeOff, Filter, Search, ChevronDown, Download, X, Play, Pause, Volume2, Home, AlertCircle } from 'lucide-react';
import { useFileUrl } from '../blob-storage/FileStorage';
import { useBirdAudio, useHasAudioFile, useGetAllBirdDetails, useGetFileReferences } from '../hooks/useQueries';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { detectWebGL, normalizeBirdName, type WebGLSupport } from '../lib/webglDetector';
import type { Coordinate, BirdData } from '../backend';

interface OwlTableRow {
  id: string;
  scientificName: string;
  location: string;
  mountainName: string;
  valleyName: string;
  state: string;
  briefDescription: string;
  notes: string;
  birdName: string;
  easting: string;
  northing: string;
  zone: string;
  northernHemisphere: string;
  latitude: number;
  longitude: number;
  associatedImage?: string;
}

// Al Buraimi Governorate coordinates - center point
const AL_BURAIMI_CENTER: [number, number] = [24.25, 56.08];
const AL_BURAIMI_ZOOM = 10;

// Utility function to validate coordinates
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return !isNaN(lat) && !isNaN(lng) && 
         isFinite(lat) && isFinite(lng) &&
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

// Component for displaying image in popup
function PopupImage({ imagePath, birdName }: { imagePath: string; birdName: string }) {
  const { data: imageUrl, isLoading, error } = useFileUrl(imagePath);

  // Log popup image loading details
  useEffect(() => {
    if (error) {
      console.error('❌ Popup image loading error:', {
        birdName,
        imagePath,
        error,
        errorMessage: (error as any)?.message,
        timestamp: new Date().toISOString()
      });
    }
  }, [error, imagePath, birdName]);

  useEffect(() => {
    if (imageUrl) {
      console.log('✅ Popup image loaded successfully:', {
        birdName,
        imagePath,
        imageUrl: imageUrl.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });
    }
  }, [imageUrl, imagePath, birdName]);

  if (isLoading) {
    return <div className="w-32 h-24 bg-gray-200 rounded flex items-center justify-center">
      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    </div>;
  }

  if (error || !imageUrl) {
    return <div className="w-32 h-24 bg-gray-200 rounded flex flex-col items-center justify-center p-1 text-center">
      <AlertCircle className="h-4 w-4 text-red-500 mb-1" />
      <p className="text-xs text-gray-600">فشل التحميل</p>
      <p className="text-xs text-gray-400 break-all" dir="ltr">{imagePath.substring(0, 20)}...</p>
    </div>;
  }

  return (
    <img 
      src={imageUrl} 
      alt="صورة الموقع" 
      className="w-32 h-24 object-cover rounded border border-gray-300"
      onError={(e) => {
        console.error('❌ Popup image render error:', {
          birdName,
          imagePath,
          imageUrl,
          timestamp: new Date().toISOString()
        });
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}

// Details Panel Component with Scrollable Description
function DetailsPanel({ 
  location, 
  locationData, 
  birdData,
  onClose 
}: { 
  location: Coordinate & { associatedImage?: string; birdName: string };
  locationData?: OwlTableRow;
  birdData?: BirdData;
  onClose: () => void;
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { data: hasAudio } = useHasAudioFile(location.birdName);
  const { data: audioPath } = useBirdAudio(location.birdName);

  const handlePlayAudio = () => {
    if (!audioRef.current || !audioPath) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      const audioUrl = `/api/blob-storage/file/${encodeURIComponent(audioPath)}`;
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlayingAudio(false);
    const handlePause = () => setIsPlayingAudio(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
    };
  }, []);

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-2xl border border-gray-300 z-[1001] w-96 max-h-[calc(100vh-8rem)] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between z-10 shrink-0">
        <h3 className="text-lg font-bold">{location.birdName}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Coordinates */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <MapPin className="h-4 w-4 ml-2 text-blue-600" />
              الإحداثيات
            </h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>خط العرض: {location.latitude.toFixed(6)}</div>
              <div>خط الطول: {location.longitude.toFixed(6)}</div>
            </div>
          </div>

          {/* Bird Details */}
          {locationData && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 mb-2">تفاصيل الطائر</h4>
              
              {locationData.scientificName && (
                <div className="bg-green-50 rounded-lg p-3 border-r-4 border-green-500">
                  <div className="text-xs font-medium text-green-800 mb-1">الاسم العلمي</div>
                  <div className="text-sm text-green-900 italic">{locationData.scientificName}</div>
                </div>
              )}

              {locationData.location && (
                <div className="bg-blue-50 rounded-lg p-3 border-r-4 border-blue-500">
                  <div className="text-xs font-medium text-blue-800 mb-1">الموقع</div>
                  <div className="text-sm text-blue-900">{locationData.location}</div>
                </div>
              )}

              {locationData.mountainName && (
                <div className="bg-yellow-50 rounded-lg p-3 border-r-4 border-yellow-500">
                  <div className="text-xs font-medium text-yellow-800 mb-1">اسم الجبل</div>
                  <div className="text-sm text-yellow-900">{locationData.mountainName}</div>
                </div>
              )}

              {locationData.valleyName && (
                <div className="bg-teal-50 rounded-lg p-3 border-r-4 border-teal-500">
                  <div className="text-xs font-medium text-teal-800 mb-1">اسم الوادي</div>
                  <div className="text-sm text-teal-900">{locationData.valleyName}</div>
                </div>
              )}

              {locationData.state && (
                <div className="bg-purple-50 rounded-lg p-3 border-r-4 border-purple-500">
                  <div className="text-xs font-medium text-purple-800 mb-1">الولاية</div>
                  <div className="text-sm text-purple-900">{locationData.state}</div>
                </div>
              )}

              {locationData.briefDescription && (
                <div className="bg-gray-50 rounded-lg p-3 border-r-4 border-gray-500">
                  <div className="text-xs font-medium text-gray-800 mb-1">الوصف</div>
                  <ScrollArea className="max-h-32">
                    <div className="text-sm text-gray-900 pr-2">{locationData.briefDescription}</div>
                  </ScrollArea>
                </div>
              )}

              {locationData.notes && (
                <div className="bg-gray-50 rounded-lg p-3 border-r-4 border-gray-400">
                  <div className="text-xs font-medium text-gray-800 mb-1">ملاحظات</div>
                  <ScrollArea className="max-h-32">
                    <div className="text-sm text-gray-900 pr-2">{locationData.notes}</div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* Main Image */}
          {location.associatedImage && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Camera className="h-4 w-4 ml-2 text-blue-600" />
                الصورة الرئيسية
              </h4>
              <ImageDisplay imagePath={location.associatedImage} birdName={location.birdName} />
            </div>
          )}

          {/* Sub-Images Gallery */}
          {birdData && birdData.subImages && birdData.subImages.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Camera className="h-4 w-4 ml-2 text-green-600" />
                الصور الفرعية ({birdData.subImages.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {birdData.subImages.map((imagePath, index) => (
                  <ImageDisplay key={index} imagePath={imagePath} birdName={location.birdName} />
                ))}
              </div>
            </div>
          )}

          {/* Audio Player */}
          {hasAudio && audioPath && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Volume2 className="h-4 w-4 ml-2 text-purple-600" />
                الصوت
              </h4>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <button
                  onClick={handlePlayAudio}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="h-4 w-4" />
                      إيقاف الصوت
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      تشغيل الصوت
                    </>
                  )}
                </button>
                <audio ref={audioRef} className="hidden" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Image Display Component
function ImageDisplay({ imagePath, birdName }: { imagePath: string; birdName: string }) {
  const { data: imageUrl, isLoading, error } = useFileUrl(imagePath);

  // Log image display details
  useEffect(() => {
    if (error) {
      console.error('❌ Image display loading error:', {
        birdName,
        imagePath,
        error,
        errorMessage: (error as any)?.message,
        timestamp: new Date().toISOString()
      });
    }
  }, [error, imagePath, birdName]);

  useEffect(() => {
    if (imageUrl) {
      console.log('✅ Image display loaded successfully:', {
        birdName,
        imagePath,
        imageUrl: imageUrl.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });
    }
  }, [imageUrl, imagePath, birdName]);

  if (isLoading) {
    return (
      <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full aspect-video bg-gray-200 rounded-lg flex flex-col items-center justify-center p-2 text-center">
        <AlertCircle className="h-6 w-6 text-red-500 mb-1" />
        <p className="text-xs text-gray-600">فشل التحميل</p>
        <p className="text-xs text-gray-400 break-all" dir="ltr">{imagePath.substring(0, 30)}...</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="صورة الطائر"
      className="w-full aspect-video object-cover rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => window.open(imageUrl, '_blank')}
      onError={() => {
        console.error('❌ Image display render error:', {
          birdName,
          imagePath,
          imageUrl,
          timestamp: new Date().toISOString()
        });
      }}
    />
  );
}

// Generate distinct colors for different bird species with normalized names
const generateSpeciesColor = (speciesName: string): string => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
    '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7',
    '#22c55e', '#eab308', '#dc2626', '#2563eb',
  ];
  
  // Use normalized name for consistent color generation
  const normalized = normalizeBirdName(speciesName);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) & 0xffffffff;
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function AllLocationsMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [hiddenSpecies, setHiddenSpecies] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState<string>('الكل');
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<(Coordinate & { associatedImage?: string; locationData?: OwlTableRow; birdName: string }) | null>(null);
  const [webglSupport, setWebglSupport] = useState<WebGLSupport | null>(null);

  // Detect WebGL support on mount
  useEffect(() => {
    const support = detectWebGL();
    setWebglSupport(support);
    
    if (support.shouldUseFallback) {
      console.log('Using 2D map fallback:', support.isMobile ? 'Mobile device detected' : 'WebGL not supported');
    }
  }, []);

  // Fetch data directly from backend using React Query
  const { data: allBirdData = [], isLoading: birdDataLoading, error: birdDataError } = useGetAllBirdDetails();
  const { data: uploadedFiles = [], isLoading: filesLoading } = useGetFileReferences();

  // Log map data loading errors
  useEffect(() => {
    if (birdDataError) {
      console.error('❌ Map bird data loading error:', {
        error: birdDataError,
        message: (birdDataError as any)?.message,
        timestamp: new Date().toISOString()
      });
    }
  }, [birdDataError]);

  // Log successful map data load
  useEffect(() => {
    if (allBirdData && !birdDataLoading) {
      console.log('✅ Map bird data loaded successfully:', {
        totalBirds: allBirdData.length,
        totalLocations: allBirdData.reduce((sum, [_, bird]) => sum + bird.locations.length, 0),
        timestamp: new Date().toISOString()
      });
    }
  }, [allBirdData, birdDataLoading]);

  // Convert backend data to locations format with normalized bird names
  const allLocations = allBirdData.flatMap(([birdName, birdData]) => {
    return birdData.locations.map((location, index) => {
      // Find associated image from subImages
      const associatedImage = birdData.subImages && birdData.subImages.length > 0 
        ? birdData.subImages[0] 
        : undefined;

      const locationData: OwlTableRow = {
        id: `${birdName}-${index}`,
        scientificName: birdData.scientificName || '',
        location: '',
        mountainName: '',
        valleyName: '',
        state: '',
        briefDescription: birdData.description || '',
        notes: birdData.notes || '',
        birdName: birdData.arabicName || birdName,
        easting: '',
        northing: '',
        zone: '',
        northernHemisphere: '',
        latitude: location.latitude,
        longitude: location.longitude,
        associatedImage
      };

      return {
        ...location,
        birdName: birdData.arabicName || birdName,
        associatedImage,
        locationData
      };
    });
  });

  const uniqueSpecies = allLocations.length > 0 
    ? Array.from(new Set(allLocations.map(loc => loc.birdName))).sort()
    : [];

  const speciesFilterOptions = ['الكل', ...uniqueSpecies];

  // Filter locations with normalized name comparison
  const filteredLocations = allLocations.filter(location => {
    if (selectedSpeciesFilter === 'الكل') {
      // Show all locations when "الكل" is selected
    } else if (normalizeBirdName(location.birdName) !== normalizeBirdName(selectedSpeciesFilter)) {
      return false;
    }
    
    if (selectedSpeciesFilter !== 'الكل' && hiddenSpecies.has(location.birdName)) return false;
    if (selectedSpeciesFilter !== 'الكل' && searchTerm && !location.birdName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  // Initialize map - static and centered on Al Buraimi with mobile compatibility
  useEffect(() => {
    if (!mapRef.current || !webglSupport) return;

    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          initializeMap();
        };
        document.head.appendChild(script);
      } else if ((window as any).L) {
        initializeMap();
      }
    };

    const initializeMap = () => {
      const L = (window as any).L;
      if (!L || mapInstanceRef.current) return;

      // Initialize map centered on Al Buraimi Governorate - static initial view
      // Enhanced mobile compatibility settings
      mapInstanceRef.current = L.map(mapRef.current, {
        center: AL_BURAIMI_CENTER,
        zoom: AL_BURAIMI_ZOOM,
        zoomControl: true,
        scrollWheelZoom: !webglSupport.shouldUseFallback, // Disable on mobile for better UX
        doubleClickZoom: true,
        dragging: true,
        tap: webglSupport.shouldUseFallback, // Enable tap on mobile
        touchZoom: webglSupport.shouldUseFallback, // Enable touch zoom on mobile
        preferCanvas: webglSupport.shouldUseFallback, // Use Canvas renderer on mobile for better performance
      }).setView(AL_BURAIMI_CENTER, AL_BURAIMI_ZOOM);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        detectRetina: true, // Better display on high-DPI screens
      }).addTo(mapInstanceRef.current);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [webglSupport]);

  // Update markers when filtered locations change with normalized name handling
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    if (filteredLocations.length > 0) {
      filteredLocations.forEach((location, index) => {
        if (isValidCoordinate(location.latitude, location.longitude)) {
          const speciesColor = generateSpeciesColor(location.birdName);
          
          let markerIcon;
          
          if (location.associatedImage) {
            const customIcon = L.divIcon({
              className: 'custom-marker-with-image',
              html: `
                <div class="marker-with-image">
                  <div class="marker-pin" style="background: ${speciesColor}; border: 3px solid white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
                  <div class="marker-camera-icon" style="position: absolute; top: -2px; right: -2px; width: 16px; height: 16px; background: #10b981; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-center; font-size: 8px; color: white; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">📷</div>
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            });
            markerIcon = customIcon;
          } else {
            const customIcon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="background: ${speciesColor}; border: 3px solid white; width: 24px; height: 24px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });
            markerIcon = customIcon;
          }

          const marker = L.marker([location.latitude, location.longitude], {
            icon: markerIcon
          }).addTo(mapInstanceRef.current);

          marker.on('click', () => {
            const birdData = allBirdData.find(([_, bird]) => 
              normalizeBirdName(bird.arabicName) === normalizeBirdName(location.birdName)
            )?.[1];

            setSelectedLocation({
              ...location,
              birdName: location.birdName,
              associatedImage: location.associatedImage,
              locationData: location.locationData
            });
          });

          markersRef.current.push(marker);
        }
      });
    }
  }, [filteredLocations, allBirdData]);

  if (birdDataLoading || filesLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">جاري تحميل بيانات الخريطة...</p>
        </div>
      </div>
    );
  }

  if (birdDataError) {
    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <div className="mx-auto max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <div className="space-y-2">
                <p className="font-semibold">فشل تحميل بيانات الخريطة</p>
                <p className="text-sm">تعذر الاتصال بالخادم أو قاعدة البيانات. يرجى المحاولة مرة أخرى.</p>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="mt-2">
                  إعادة المحاولة
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!allBirdData || allBirdData.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <div className="mx-auto max-w-2xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <p>لا توجد بيانات مواقع في قاعدة البيانات حالياً.</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-right">خريطة جميع المواقع</h1>
        
        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full h-[600px] md:h-[700px] rounded-lg shadow-lg border border-border"
          />
          
          {selectedLocation && (
            <DetailsPanel
              location={selectedLocation}
              locationData={selectedLocation.locationData}
              birdData={allBirdData.find(([_, bird]) => 
                normalizeBirdName(bird.arabicName) === normalizeBirdName(selectedLocation.birdName)
              )?.[1]}
              onClose={() => setSelectedLocation(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
