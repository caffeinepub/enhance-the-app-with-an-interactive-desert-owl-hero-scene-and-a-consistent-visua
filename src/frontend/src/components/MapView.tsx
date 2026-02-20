import { useEffect, useRef } from 'react';
import { MapPin, Loader2, Camera } from 'lucide-react';
import { useFileUrl } from '../blob-storage/FileStorage';
import type { Coordinate, FileReference } from '../backend';

interface MapViewProps {
  locations: (Coordinate & { associatedImage?: string; locationData?: any })[];
  selectedBird: string;
  isLoading: boolean;
  hasAnyBirds: boolean;
  uploadedFiles: FileReference[];
}

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

export default function MapView({ locations, selectedBird, isLoading, hasAnyBirds, uploadedFiles }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Filter locations to only include valid coordinates
  const validLocations = locations.filter(location => 
    isValidCoordinate(location.latitude, location.longitude)
  );

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !(window as any).L) {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Load Leaflet JS
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

      // Initialize map centered on Al Buraimi Governorate
      mapInstanceRef.current = L.map(mapRef.current).setView([24.15, 56.13], 10);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Add custom CSS for markers with images
      const style = document.createElement('style');
      style.textContent = `
        .marker-with-image {
          position: relative;
          width: 30px;
          height: 40px;
        }
        .marker-pin {
          width: 30px;
          height: 40px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .marker-camera-icon {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 16px;
          height: 16px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
      `;
      document.head.appendChild(style);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when valid locations change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers only for valid locations
    if (validLocations.length > 0) {
      validLocations.forEach((location, index) => {
        // Double-check coordinate validity before creating marker
        if (isValidCoordinate(location.latitude, location.longitude)) {
          let markerIcon;
          
          if (location.associatedImage) {
            // Create custom icon with camera indicator for locations with images
            const customIcon = L.divIcon({
              className: 'custom-marker-with-image',
              html: `
                <div class="marker-with-image">
                  <div class="marker-pin" style="background: #10b981;"></div>
                  <div class="marker-camera-icon">📷</div>
                </div>
              `,
              iconSize: [30, 40],
              iconAnchor: [15, 40],
              popupAnchor: [0, -40]
            });
            markerIcon = L.marker([location.latitude, location.longitude], { icon: customIcon });
          } else {
            // Standard marker for locations without images
            markerIcon = L.marker([location.latitude, location.longitude]);
          }

          // Create popup content
          const popupContent = document.createElement('div');
          popupContent.style.direction = 'rtl';
          popupContent.style.textAlign = 'right';
          popupContent.style.fontFamily = 'Noto Sans Arabic, system-ui, sans-serif';
          popupContent.style.minWidth = '250px';
          popupContent.style.maxWidth = '350px';

          // Basic location info
          const locationInfo = `
            <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
              <strong style="color: #1f2937; font-size: 18px; display: block; margin-bottom: 4px;">${selectedBird}</strong>
              <span style="color: #6b7280; font-size: 14px; display: block; margin-bottom: 2px;">الموقع ${index + 1}</span>
              <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                <span style="display: block;">خط العرض: ${location.latitude.toFixed(6)}</span>
                <span style="display: block;">خط الطول: ${location.longitude.toFixed(6)}</span>
              </div>
            </div>
          `;

          popupContent.innerHTML = locationInfo;

          // Add location details if available
          if (location.locationData) {
            const details = location.locationData;
            const detailsHtml = `
              <div style="margin-bottom: 12px; padding-bottom: 8px;">
                ${details.scientificName ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #f0fdf4; border-radius: 4px; border-right: 3px solid #10b981;"><strong style="color: #166534;">الاسم العلمي:</strong> <em style="color: #15803d;">${details.scientificName}</em></div>` : ''}
                ${details.location ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #eff6ff; border-radius: 4px; border-right: 3px solid #3b82f6;"><strong style="color: #1e40af;">الموقع:</strong> <span style="color: #1d4ed8;">${details.location}</span></div>` : ''}
                ${details.mountainName ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #fef3c7; border-radius: 4px; border-right: 3px solid #f59e0b;"><strong style="color: #92400e;">اسم الجبل:</strong> <span style="color: #b45309;">${details.mountainName}</span></div>` : ''}
                ${details.valleyName ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #ecfdf5; border-radius: 4px; border-right: 3px solid #059669;"><strong style="color: #047857;">اسم الوادي:</strong> <span style="color: #065f46;">${details.valleyName}</span></div>` : ''}
                ${details.state ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #faf5ff; border-radius: 4px; border-right: 3px solid #8b5cf6;"><strong style="color: #7c3aed;">الولاية:</strong> <span style="color: #6d28d9;">${details.state}</span></div>` : ''}
                ${details.notes ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #f9fafb; border-radius: 4px; border-right: 3px solid #6b7280;"><strong style="color: #374151;">ملاحظات:</strong> <span style="color: #4b5563;">${details.notes}</span></div>` : ''}
              </div>
            `;
            popupContent.innerHTML += detailsHtml;
          }

          // Add image if available
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

          // Render image after popup is opened
          if (location.associatedImage) {
            markerIcon.on('popupopen', () => {
              const imageContainer = document.getElementById(`popup-image-${index}`);
              if (imageContainer) {
                // Create image element with loading state
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
                
                // Loading placeholder
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
                
                // Load the actual image using the file storage system
                const loadImage = async () => {
                  try {
                    // Use the file URL hook to get the image URL
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

      // Fit map to show all markers
      if (markersRef.current.length > 0) {
        const group = new L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [validLocations, selectedBird, uploadedFiles]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">جاري تحميل المواقع...</p>
        </div>
      </div>
    );
  }

  if (!selectedBird) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">اختر نوع الطائر لعرض مواقع انتشاره على الخريطة</p>
          <p className="text-gray-500 text-sm mt-2">المواقع المرتبطة بصور ستظهر بأيقونة كاميرا مميزة</p>
        </div>
      </div>
    );
  }

  if (validLocations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">لا توجد مواقع صالحة مسجلة لهذا النوع من الطيور</p>
          <p className="text-gray-500 text-sm mt-2">يمكنك إضافة مواقع من خلال جدول البيانات</p>
          {locations.length > validLocations.length && (
            <p className="text-orange-600 text-sm mt-2">
              ⚠️ تم العثور على {locations.length - validLocations.length} موقع بإحداثيات غير صالحة
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div ref={mapRef} className="h-full w-full" />
      <div className="absolute top-4 right-4 bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200 z-[1000]">
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2 space-x-reverse">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-gray-700 font-medium">{validLocations.length} موقع صالح</span>
          </div>
          {validLocations.some(loc => loc.associatedImage) && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Camera className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600 font-medium">
                {validLocations.filter(loc => loc.associatedImage).length} موقع مصور
              </span>
            </div>
          )}
          {locations.length > validLocations.length && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-orange-600 text-xs">
                ⚠️ {locations.length - validLocations.length} موقع بإحداثيات غير صالحة
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200 z-[1000]">
        <div className="text-sm font-medium text-gray-900 mb-2">دليل الخريطة</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-3 h-3 bg-blue-500 rounded-full border border-white shadow-sm"></div>
            <span className="text-gray-600">موقع عادي</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm relative">
              <div className="absolute -top-1 -right-1 text-[8px]">📷</div>
            </div>
            <span className="text-gray-600">موقع مصور</span>
          </div>
        </div>
      </div>
    </div>
  );
}
