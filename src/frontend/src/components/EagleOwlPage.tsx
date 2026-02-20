import { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Loader2, Camera, Bird, Eye, EyeOff, Filter, Search, Home } from 'lucide-react';
import { useFileUrl } from '../blob-storage/FileStorage';
import { useGetAllBirdDetails, useGetFileReferences } from '../hooks/useQueries';
import { detectWebGL, normalizeBirdName, type WebGLSupport } from '../lib/webglDetector';
import type { Coordinate, BirdData } from '../backend';

interface OwlTableRow {
  id: string;
  localName: string;
  scientificName: string;
  location: string;
  mountainName: string;
  valleyName: string;
  state: string;
  coordinate40R: string;
  coordinateUTM: string;
  notes: string;
  birdName: string;
  easting: string;
  northing: string;
  zone: string;
  northernHemisphere: string;
  latitude: number;
  longitude: number;
  associatedImage?: string;
  briefDescription: string;
}

// Al Buraimi Governorate coordinates - center point for eagle owl map
const AL_BURAIMI_CENTER: [number, number] = [24.25, 56.08];
const AL_BURAIMI_ZOOM = 10;

// Utility function to validate coordinates
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return !isNaN(lat) && !isNaN(lng) && 
         isFinite(lat) && isFinite(lng) &&
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

// Function to check if a bird name contains eagle owl related terms
const isEagleOwlSpecies = (birdName: string): boolean => {
  const normalizedName = birdName.toLowerCase().trim();
  const eagleOwlTerms = [
    'بوم', 'بومة', 'نسارية', 'نساري', 'eagle owl', 'owl', 'bubo'
  ];
  
  return eagleOwlTerms.some(term => normalizedName.includes(term.toLowerCase()));
};

// Generate distinct colors for different eagle owl species
const generateSpeciesColor = (speciesName: string): string => {
  const colors = [
    '#8b5a2b', // brown
    '#d2691e', // chocolate
    '#cd853f', // peru
    '#daa520', // goldenrod
    '#b8860b', // dark goldenrod
    '#a0522d', // sienna
    '#8b4513', // saddle brown
    '#d2b48c', // tan
  ];
  
  // Use normalized name for consistent color generation
  const normalized = normalizeBirdName(speciesName);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) & 0xffffffff;
  }
  return colors[Math.abs(hash) % colors.length];
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

export default function EagleOwlPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const [selectedSpecies, setSelectedSpecies] = useState<string>('اختر نوع الطير');
  const [hiddenSpecies, setHiddenSpecies] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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

  // Convert backend data to owl table format with normalized bird names
  const owlTableData: OwlTableRow[] = allBirdData.flatMap(([birdName, birdData]) => {
    return birdData.locations.map((location, index) => {
      // Find associated image from subImages
      const associatedImage = birdData.subImages && birdData.subImages.length > 0 
        ? birdData.subImages[0] 
        : undefined;

      return {
        id: `${birdName}-${index}`,
        localName: birdData.arabicName || birdName,
        scientificName: birdData.scientificName || '',
        location: '',
        mountainName: '',
        valleyName: '',
        state: '',
        coordinate40R: '',
        coordinateUTM: '',
        notes: birdData.notes || '',
        birdName: birdData.arabicName || birdName,
        easting: '',
        northing: '',
        zone: '',
        northernHemisphere: '',
        latitude: location.latitude,
        longitude: location.longitude,
        associatedImage,
        briefDescription: birdData.description || ''
      };
    });
  });

  // Filter owl table data to only include eagle owl species
  const eagleOwlData = owlTableData.filter(row => 
    row.birdName && isEagleOwlSpecies(row.birdName)
  );

  // Get unique eagle owl species with normalized names for comparison
  const uniqueEagleOwlSpecies = Array.from(
    new Set(eagleOwlData.map(row => row.birdName))
  ).sort();

  // Get all eagle owl locations with valid coordinates
  const allEagleOwlLocations = eagleOwlData
    .filter(row => isValidCoordinate(row.latitude, row.longitude))
    .map(row => ({
      latitude: row.latitude,
      longitude: row.longitude,
      associatedImage: row.associatedImage,
      locationData: row,
      birdName: row.birdName
    }));

  // Filter locations based on selected species and other filters with normalized name comparison
  const filteredLocations = allEagleOwlLocations.filter(location => {
    // Apply species filter with normalized comparison
    if (selectedSpecies === 'تحديد الكل') {
      // Show all eagle owl locations
    } else if (selectedSpecies === 'اختر نوع الطير') {
      // Show no locations when default option is selected
      return false;
    } else if (normalizeBirdName(location.birdName) !== normalizeBirdName(selectedSpecies)) {
      return false;
    }
    
    // Apply hidden species filter (only when not showing all)
    if (selectedSpecies !== 'تحديد الكل' && selectedSpecies !== 'اختر نوع الطير' && hiddenSpecies.has(location.birdName)) return false;
    
    // Apply search term filter (only when not showing all and search term exists)
    if (selectedSpecies !== 'تحديد الكل' && selectedSpecies !== 'اختر نوع الطير' && searchTerm && !location.birdName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
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

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers for filtered locations
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

          // Create popup content
          const popupContent = document.createElement('div');
          popupContent.style.direction = 'rtl';
          popupContent.style.textAlign = 'right';
          popupContent.style.fontFamily = 'Noto Sans Arabic, system-ui, sans-serif';
          popupContent.style.minWidth = '250px';
          popupContent.style.maxWidth = '350px';

          const locationInfo = `
            <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
              <strong style="color: ${speciesColor}; font-size: 18px; display: block; margin-bottom: 4px;">${location.birdName}</strong>
              <span style="color: #6b7280; font-size: 14px; display: block; margin-bottom: 2px;">الموقع ${index + 1}</span>
              <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                <span style="display: block;">خط العرض: ${location.latitude.toFixed(6)}</span>
                <span style="display: block;">خط الطول: ${location.longitude.toFixed(6)}</span>
              </div>
            </div>
          `;

          popupContent.innerHTML = locationInfo;

          if (location.locationData) {
            const details = location.locationData;
            const detailsHtml = `
              <div style="margin-bottom: 12px; padding-bottom: 8px;">
                ${details.scientificName ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #f0fdf4; border-radius: 4px; border-right: 3px solid #10b981;"><strong style="color: #166534;">الاسم العلمي:</strong> <em style="color: #15803d;">${details.scientificName}</em></div>` : ''}
                ${details.location ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #eff6ff; border-radius: 4px; border-right: 3px solid ${speciesColor};"><strong style="color: #1e40af;">الموقع:</strong> <span style="color: #1d4ed8;">${details.location}</span></div>` : ''}
                ${details.mountainName ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #fef3c7; border-radius: 4px; border-right: 3px solid #f59e0b;"><strong style="color: #92400e;">اسم الجبل:</strong> <span style="color: #b45309;">${details.mountainName}</span></div>` : ''}
                ${details.valleyName ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #ecfdf5; border-radius: 4px; border-right: 3px solid #059669;"><strong style="color: #047857;">اسم الوادي:</strong> <span style="color: #065f46;">${details.valleyName}</span></div>` : ''}
                ${details.state ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #faf5ff; border-radius: 4px; border-right: 3px solid #8b5cf6;"><strong style="color: #7c3aed;">الولاية:</strong> <span style="color: #6d28d9;">${details.state}</span></div>` : ''}
                ${details.briefDescription ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #f8fafc; border-radius: 4px; border-right: 3px solid #64748b;"><strong style="color: #334155;">الوصف:</strong> <span style="color: #475569;">${details.briefDescription}</span></div>` : ''}
                ${details.notes ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #f9fafb; border-radius: 4px; border-right: 3px solid #6b7280;"><strong style="color: #374151;">ملاحظات:</strong> <span style="color: #4b5563;">${details.notes}</span></div>` : ''}
              </div>
            `;
            popupContent.innerHTML += detailsHtml;
          }

          if (location.associatedImage) {
            const imageContainer = document.createElement('div');
            imageContainer.style.marginTop = '12px';
            imageContainer.style.paddingTop = '12px';
            imageContainer.style.borderTop = '2px solid #e5e7eb';
            imageContainer.innerHTML = `
              <div style="margin-bottom: 8px;">
                <strong style="color: #1f2937; font-size: 16px; display: flex; align-items: center;">
                  <span style="margin-left: 6px;">📷</span>
                  الصورة المرتبطة
                </strong>
              </div>
              <div id="popup-image-${index}" style="text-align: center;"></div>
            `;
            popupContent.appendChild(imageContainer);
          }

          markerIcon.addTo(mapInstanceRef.current).bindPopup(popupContent, {
            maxWidth: 350,
            className: 'custom-popup'
          });

          if (location.associatedImage) {
            markerIcon.on('popupopen', () => {
              const imageContainer = document.getElementById(`popup-image-${index}`);
              if (imageContainer) {
                const imageWrapper = document.createElement('div');
                imageWrapper.style.position = 'relative';
                imageWrapper.style.display = 'inline-block';
                
                const img = document.createElement('img');
                img.style.width = '160px';
                img.style.height = '120px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.border = '2px solid #e5e7eb';
                img.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                img.alt = 'صورة الموقع';
                
                const loadingDiv = document.createElement('div');
                loadingDiv.style.width = '160px';
                loadingDiv.style.height = '120px';
                loadingDiv.style.background = '#f3f4f6';
                loadingDiv.style.borderRadius = '8px';
                loadingDiv.style.display = 'flex';
                loadingDiv.style.alignItems = 'center';
                loadingDiv.style.justifyContent = 'center';
                loadingDiv.style.border = '2px solid #e5e7eb';
                loadingDiv.innerHTML = '<div style="color: #9ca3af; font-size: 12px;">جاري التحميل...</div>';
                
                imageWrapper.appendChild(loadingDiv);
                imageContainer.appendChild(imageWrapper);
                
                const loadImage = async () => {
                  try {
                    const response = await fetch(`/api/blob-storage/file/${encodeURIComponent(location.associatedImage!)}`);
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      img.src = url;
                      img.onload = () => {
                        imageWrapper.removeChild(loadingDiv);
                        imageWrapper.appendChild(img);
                      };
                      img.onerror = () => {
                        loadingDiv.innerHTML = '<div style="color: #ef4444; font-size: 12px;">خطأ في تحميل الصورة</div>';
                      };
                    } else {
                      loadingDiv.innerHTML = '<div style="color: #ef4444; font-size: 12px;">خطأ في تحميل الصورة</div>';
                    }
                  } catch (error) {
                    loadingDiv.innerHTML = '<div style="color: #ef4444; font-size: 12px;">خطأ في تحميل الصورة</div>';
                  }
                };
                
                loadImage();
              }
            });
          }

          markersRef.current.push(markerIcon);
        }
      });

      // Only fit bounds if there are markers and specific species selected
      if (markersRef.current.length > 0 && selectedSpecies !== 'تحديد الكل' && selectedSpecies !== 'اختر نوع الطير') {
        const group = new L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      } else if (markersRef.current.length > 0 && selectedSpecies === 'تحديد الكل') {
        // When showing all, keep the static Al Buraimi view
        mapInstanceRef.current.setView(AL_BURAIMI_CENTER, AL_BURAIMI_ZOOM);
      }
    } else {
      // No markers - keep centered on Al Buraimi
      mapInstanceRef.current.setView(AL_BURAIMI_CENTER, AL_BURAIMI_ZOOM);
    }
  }, [filteredLocations, selectedSpecies]);

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
    setHiddenSpecies(new Set(uniqueEagleOwlSpecies));
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  // Show loading state
  if (birdDataLoading || filesLoading || !webglSupport) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">جاري تحميل بيانات البوم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200 p-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 space-x-reverse mb-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <Bird className="h-8 w-8 text-amber-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">مواقع انتشار البوم بمحافظة البريمي</h1>
              <p className="text-base text-gray-600 mt-1">
                عرض تفاعلي لمواقع انتشار طيور البوم في محافظة البريمي
              </p>
              {webglSupport.shouldUseFallback && (
                <p className="text-sm text-blue-600 mt-1">
                  {webglSupport.isMobile ? '📱 وضع الجوال - خريطة ثنائية الأبعاد' : '🗺️ خريطة ثنائية الأبعاد'}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-amber-200">
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <Bird className="h-6 w-6 text-amber-600" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{uniqueEagleOwlSpecies.length}</p>
                  <p className="text-sm text-amber-800">أنواع البوم</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <MapPin className="h-6 w-6 text-green-600" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{allEagleOwlLocations.length}</p>
                  <p className="text-sm text-green-800">إجمالي المواقع</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <Camera className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {allEagleOwlLocations.filter(loc => loc.associatedImage).length}
                  </p>
                  <p className="text-sm text-blue-800">المواقع المصورة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Species Dropdown */}
          <div className="flex-1 max-w-md">
            <div className="bg-white rounded-lg shadow-md border border-amber-200 p-4">
              <label className="block text-sm font-medium text-gray-800 mb-2 text-right">
                اختر نوع البوم
              </label>
              <div className="relative">
                <select
                  value={selectedSpecies}
                  onChange={(e) => setSelectedSpecies(e.target.value)}
                  className="w-full px-4 py-2 pr-10 text-base bg-white border border-amber-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition-all appearance-none text-right font-medium hover:border-amber-400"
                  dir="rtl"
                >
                  <option value="اختر نوع الطير">اختر نوع الطير</option>
                  <option value="تحديد الكل">تحديد الكل</option>
                  {uniqueEagleOwlSpecies.map((species) => (
                    <option key={species} value={species}>
                      {species}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-600 pointer-events-none" />
              </div>
              
              <div className="mt-3 bg-amber-50 rounded-md p-3 border border-amber-200">
                <p className="text-sm text-amber-800 text-right font-medium">
                  {selectedSpecies === 'تحديد الكل' 
                    ? `عرض جميع مواقع البوم (${filteredLocations.length} موقع)` 
                    : selectedSpecies === 'اختر نوع الطير'
                    ? 'اختر نوع البوم لعرض مواقعه على الخريطة'
                    : `عرض مواقع ${selectedSpecies} (${filteredLocations.length} موقع)`
                  }
                </p>
              </div>
              
              {/* Advanced Filters Toggle */}
              {uniqueEagleOwlSpecies.length > 0 && selectedSpecies !== 'تحديد الكل' && selectedSpecies !== 'اختر نوع الطير' && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <Filter className="h-4 w-4 ml-2" />
                    {showFilters ? 'إخفاء المرشحات' : 'مرشحات متقدمة'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Back to Homepage Button */}
          <button
            onClick={handleBackToHome}
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
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />
        
        {/* Advanced Filters Panel */}
        {showFilters && uniqueEagleOwlSpecies.length > 0 && selectedSpecies !== 'تحديد الكل' && selectedSpecies !== 'اختر نوع الطير' && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-[1000] w-80">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 text-base">مرشحات متقدمة</h3>
            </div>

            <div className="p-4">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="البحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Species Controls */}
              <div className="flex space-x-2 space-x-reverse mb-3">
                <button
                  onClick={showAllSpecies}
                  className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  إظهار الكل
                </button>
                <button
                  onClick={hideAllSpecies}
                  className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  إخفاء الكل
                </button>
              </div>

              {/* Species Legend */}
              <div className="max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-900 mb-3">أنواع البوم</h4>
                <div className="space-y-2">
                  {uniqueEagleOwlSpecies
                    .filter(species => {
                      if (selectedSpecies !== 'تحديد الكل' && selectedSpecies !== 'اختر نوع الطير' && normalizeBirdName(species) !== normalizeBirdName(selectedSpecies)) {
                        return false;
                      }
                      return !searchTerm || species.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map((species) => {
                      const isHidden = hiddenSpecies.has(species);
                      const speciesColor = generateSpeciesColor(species);
                      const speciesCount = allEagleOwlLocations.filter(loc => normalizeBirdName(loc.birdName) === normalizeBirdName(species)).length;
                      const visibleCount = filteredLocations.filter(loc => normalizeBirdName(loc.birdName) === normalizeBirdName(species)).length;
                      
                      return (
                        <div
                          key={species}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
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
        {allEagleOwlLocations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-[999]">
            <div className="text-center bg-white p-8 rounded-lg shadow-lg border border-gray-200 max-w-md">
              <Bird className="h-16 w-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد مواقع بوم مسجلة</h3>
              <p className="text-gray-600 mb-4">
                يمكنك إضافة مواقع البوم من خلال جدول البيانات لتظهر هنا على الخريطة
              </p>
              <p className="text-sm text-gray-500">
                تأكد من أن أسماء الطيور تحتوي على كلمات مثل "بوم" أو "بومة"
              </p>
            </div>
          </div>
        )}

        {/* Default Selection State */}
        {selectedSpecies === 'اختر نوع الطير' && allEagleOwlLocations.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-[999]">
            <div className="text-center bg-white p-8 rounded-lg shadow-lg border border-gray-200 max-w-md">
              <Bird className="h-16 w-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">اختر نوع البوم</h3>
              <p className="text-gray-600 mb-4">
                استخدم القائمة المنسدلة أعلاه لاختيار نوع معين من البوم أو اختر "تحديد الكل" لعرض جميع المواقع
              </p>
              <p className="text-sm text-gray-500">
                متوفر {uniqueEagleOwlSpecies.length} نوع من البوم مع {allEagleOwlLocations.length} موقع
              </p>
            </div>
          </div>
        )}

        {/* Current Selection Info */}
        <div className="absolute top-4 right-4 bg-white px-4 py-3 rounded-lg shadow-md border border-gray-200 z-[1000]">
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Bird className="h-4 w-4 text-amber-600" />
              <span className="text-gray-700 font-medium truncate max-w-[200px]" title={selectedSpecies}>
                {selectedSpecies === 'تحديد الكل' 
                  ? 'جميع الأنواع' 
                  : selectedSpecies === 'اختر نوع الطير'
                  ? 'لم يتم اختيار'
                  : selectedSpecies
                }
              </span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-gray-700 font-medium">{filteredLocations.length} موقع</span>
            </div>
            {filteredLocations.some(loc => loc.associatedImage) && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <Camera className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600 font-medium">
                  {filteredLocations.filter(loc => loc.associatedImage).length} مصور
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
