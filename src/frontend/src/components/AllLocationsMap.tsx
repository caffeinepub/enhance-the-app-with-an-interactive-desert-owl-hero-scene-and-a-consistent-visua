import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, Camera, Eye, EyeOff, Filter, Search, ChevronDown, Download, X, Play, Pause, Volume2, Home } from 'lucide-react';
import { useFileUrl } from '../blob-storage/FileStorage';
import { useBirdAudio, useHasAudioFile, useGetAllBirdDetails, useGetFileReferences } from '../hooks/useQueries';
import { ScrollArea } from '@/components/ui/scroll-area';
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
function PopupImage({ imagePath }: { imagePath: string }) {
  const { data: imageUrl, isLoading } = useFileUrl(imagePath);

  if (isLoading) {
    return <div className="w-32 h-24 bg-gray-200 rounded flex items-center justify-center">
      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    </div>;
  }

  if (!imageUrl) {
    return <div className="w-32 h-24 bg-gray-200 rounded flex items-center justify-center">
      <Camera className="h-4 w-4 text-gray-400" />
    </div>;
  }

  return (
    <img 
      src={imageUrl} 
      alt="صورة الموقع" 
      className="w-32 h-24 object-cover rounded border border-gray-300"
      onError={(e) => {
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
              <ImageDisplay imagePath={location.associatedImage} />
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
                  <ImageDisplay key={index} imagePath={imagePath} />
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
function ImageDisplay({ imagePath }: { imagePath: string }) {
  const { data: imageUrl, isLoading } = useFileUrl(imagePath);

  if (isLoading) {
    return (
      <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
        <Camera className="h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="صورة الطائر"
      className="w-full aspect-video object-cover rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => window.open(imageUrl, '_blank')}
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
  const { data: allBirdData = [], isLoading: birdDataLoading } = useGetAllBirdDetails();
  const { data: uploadedFiles = [], isLoading: filesLoading } = useGetFileReferences();

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
                  <div class="marker-pin" style="background: ${speciesColor}; border: 3px solid white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
                  <div class="marker-camera-icon" style="position: absolute; top: -2px; right: -2px; width: 16px; height: 16px; background: #10b981; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);">📷</div>
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
              popupAnchor: [0, -15]
            });
            markerIcon = L.marker([location.latitude, location.longitude], { icon: customIcon });
          } else {
            const customIcon = L.divIcon({
              className: 'custom-colored-marker',
              html: `
                <div style="background: ${speciesColor}; border: 3px solid white; width: 24px; height: 24px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
              popupAnchor: [0, -12]
            });
            markerIcon = L.marker([location.latitude, location.longitude], { icon: customIcon });
          }

          // Add click event to show details panel
          markerIcon.on('click', () => {
            setSelectedLocation(location);
          });

          markerIcon.addTo(mapInstanceRef.current);
          markersRef.current.push(markerIcon);
        }
      });

      // Only fit bounds if there are markers, otherwise keep centered on Al Buraimi
      if (markersRef.current.length > 0 && filteredLocations.length < allLocations.length) {
        // Only auto-fit when filtering to specific species
        const group = new L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      } else if (markersRef.current.length > 0 && selectedSpeciesFilter === 'الكل') {
        // When showing all, keep the static Al Buraimi view
        mapInstanceRef.current.setView(AL_BURAIMI_CENTER, AL_BURAIMI_ZOOM);
      }
    } else {
      // No markers - keep centered on Al Buraimi
      mapInstanceRef.current.setView(AL_BURAIMI_CENTER, AL_BURAIMI_ZOOM);
    }
  }, [filteredLocations, allLocations.length, selectedSpeciesFilter]);

  const toggleSpeciesVisibility = (speciesName: string) => {
    setHiddenSpecies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(speciesName)) {
        newSet.delete(speciesName);
      } else {
        newSet.add(speciesName);
      }
      return newSet;
    });
  };

  const showAllSpecies = () => {
    setHiddenSpecies(new Set());
  };

  const hideAllSpecies = () => {
    setHiddenSpecies(new Set(uniqueSpecies));
  };

  const handleSpeciesFilterChange = (species: string) => {
    setSelectedSpeciesFilter(species);
    setHiddenSpecies(new Set());
    setSearchTerm('');
  };

  const downloadMapAsImage = async () => {
    if (!mapInstanceRef.current || isDownloading) return;

    try {
      setIsDownloading(true);

      const mapElement = mapRef.current;
      if (!mapElement) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = mapElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#333333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('خريطة مواقع الطيور - محافظة البريمي', canvas.width / 2, 30);
      
      const filterText = selectedSpeciesFilter === 'الكل' 
        ? `جميع المواقع (${filteredLocations.length} موقع)`
        : `مواقع ${selectedSpeciesFilter} (${filteredLocations.length} موقع)`;
      
      ctx.font = '14px Arial';
      ctx.fillText(filterText, canvas.width / 2, 55);

      const now = new Date();
      const timestamp = now.toLocaleDateString('ar-SA') + ' - ' + now.toLocaleTimeString('ar-SA');
      ctx.font = '12px Arial';
      ctx.fillText(timestamp, canvas.width / 2, canvas.height - 20);

      const link = document.createElement('a');
      const filename = selectedSpeciesFilter === 'الكل' 
        ? `خريطة-جميع-مواقع-الطيور-${now.toISOString().split('T')[0]}.png`
        : `خريطة-مواقع-${selectedSpeciesFilter}-${now.toISOString().split('T')[0]}.png`;
      
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        alert('تم تحميل الخريطة بنجاح! ملاحظة: هذه نسخة مبسطة من الخريطة.');
      }, 100);

    } catch (error) {
      console.error('Error downloading map:', error);
      alert('حدث خطأ أثناء تحميل الخريطة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNavigateToHome = () => {
    window.location.href = '/';
  };

  // Get bird data for selected location with normalized name matching
  const selectedBirdData = selectedLocation && allBirdData 
    ? allBirdData.find(([name]) => normalizeBirdName(name) === normalizeBirdName(selectedLocation.birdName))?.[1]
    : undefined;

  // Show loading state
  if (birdDataLoading || filesLoading || !webglSupport) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">جاري تحميل بيانات الخريطة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative flex flex-col">
      {/* Map Statistics Section */}
      <div className="bg-white border-b border-gray-200 p-4 z-[1000] shrink-0">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-md border border-blue-200 p-4 mb-4">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-blue-900 mb-2 text-right">إحصائيات الخريطة</h3>
            <p className="text-sm text-blue-700 text-right">
              معلومات شاملة عن البيانات المعروضة
              {webglSupport.shouldUseFallback && (
                <span className="mr-2">
                  {webglSupport.isMobile ? '📱 وضع الجوال - خريطة ثنائية الأبعاد' : '🗺️ خريطة ثنائية الأبعاد'}
                </span>
              )}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{allLocations.length}</div>
              <div className="text-sm text-blue-800">إجمالي المواقع</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{filteredLocations.length}</div>
              <div className="text-sm text-green-800">المواقع المعروضة</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{uniqueSpecies.length}</div>
              <div className="text-sm text-purple-800">أنواع الطيور</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {filteredLocations.filter(loc => loc.associatedImage).length}
              </div>
              <div className="text-sm text-orange-800">المواقع المصورة</div>
            </div>
          </div>
          
          {selectedSpeciesFilter !== 'الكل' && (
            <div className="mt-3 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="text-center">
                <span className="text-sm font-medium text-yellow-800">
                  النوع المحدد: <span className="font-bold">{selectedSpeciesFilter}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Species Filter, Download, and Back to Home Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="bg-white rounded-lg shadow-md border border-blue-200 p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-800 mb-2 text-right">
                  اختر نوع الطائر
                </label>
                <div className="relative">
                  <select
                    value={selectedSpeciesFilter}
                    onChange={(e) => handleSpeciesFilterChange(e.target.value)}
                    className="w-full px-4 py-2 pr-10 bg-white border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all appearance-none text-right text-base font-medium hover:border-blue-400"
                    dir="rtl"
                  >
                    {speciesFilterOptions.map((species) => (
                      <option key={species} value={species} className="text-right py-2">
                        {species}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-800 text-right font-medium">
                  {selectedSpeciesFilter === 'الكل' 
                    ? `عرض جميع المواقع (${filteredLocations.length} موقع)` 
                    : `عرض مواقع ${selectedSpeciesFilter} (${filteredLocations.length} موقع)`
                  }
                </p>
                {uniqueSpecies.length > 0 && (
                  <p className="text-sm text-blue-600 text-right mt-1">
                    إجمالي الأنواع: {uniqueSpecies.length}
                  </p>
                )}
              </div>
              
              {uniqueSpecies.length > 0 && selectedSpeciesFilter !== 'الكل' && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                    title="إظهار/إخفاء المرشحات المتقدمة"
                  >
                    <Filter className="h-4 w-4 ml-2" />
                    {showFilters ? 'إخفاء المرشحات' : 'مرشحات متقدمة'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Back to Homepage Button */}
            <button
              onClick={handleNavigateToHome}
              className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative z-[1100]"
              title="عودة إلى الصفحة الرئيسية"
              aria-label="عودة إلى الصفحة الرئيسية"
              style={{ 
                pointerEvents: 'auto',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              <Home className="h-8 w-8" />
            </button>

            {/* Download Map Button */}
            <button
              onClick={downloadMapAsImage}
              disabled={isDownloading}
              className="visual-download-icon-button flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100 relative z-[1100]"
              title="تحميل الخريطة كصورة"
              aria-label="تحميل الخريطة كصورة"
              style={{ 
                pointerEvents: 'auto',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                touchAction: 'manipulation'
              }}
            >
              {isDownloading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Download className="h-8 w-8" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />
        
        {/* Details Panel */}
        {selectedLocation && (
          <DetailsPanel
            location={selectedLocation}
            locationData={selectedLocation.locationData}
            birdData={selectedBirdData}
            onClose={() => setSelectedLocation(null)}
          />
        )}
        
        {/* Advanced Filters Panel */}
        {showFilters && uniqueSpecies.length > 0 && selectedSpeciesFilter !== 'الكل' && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-[1000] max-w-xs">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">مرشحات متقدمة</h3>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="البحث في أنواع الطيور..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="flex space-x-2 space-x-reverse mb-3">
                <button
                  onClick={showAllSpecies}
                  className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  إظهار الكل
                </button>
                <button
                  onClick={hideAllSpecies}
                  className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  إخفاء الكل
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-900 mb-3">أنواع الطيور</h4>
                <div className="space-y-2">
                  {uniqueSpecies
                    .filter(species => {
                      if (selectedSpeciesFilter !== 'الكل' && normalizeBirdName(species) !== normalizeBirdName(selectedSpeciesFilter)) {
                        return false;
                      }
                      return !searchTerm || species.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map((species) => {
                      const isHidden = hiddenSpecies.has(species);
                      const speciesColor = generateSpeciesColor(species);
                      const speciesCount = allLocations.filter(loc => normalizeBirdName(loc.birdName) === normalizeBirdName(species)).length;
                      const visibleCount = filteredLocations.filter(loc => normalizeBirdName(loc.birdName) === normalizeBirdName(species)).length;
                      
                      return (
                        <div
                          key={species}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                            isHidden ? 'bg-gray-100 opacity-50' : 'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => toggleSpeciesVisibility(species)}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-white shadow-sm shrink-0 ml-2"
                              style={{ backgroundColor: speciesColor }}
                            />
                            <span className="text-sm text-gray-900 truncate" title={species}>
                              {species}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                            <span className="text-xs text-gray-500">
                              {isHidden ? 0 : visibleCount}/{speciesCount}
                            </span>
                            {isHidden ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {allLocations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-[999]">
            <div className="text-center bg-white p-8 rounded-lg shadow-lg border border-gray-200 max-w-md">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد مواقع مسجلة بعد</h3>
              <p className="text-gray-600 mb-4">
                يمكنك إضافة مواقع الطيور من خلال جدول البيانات لتظهر هنا على الخريطة
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
