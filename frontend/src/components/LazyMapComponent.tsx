import { useState, useEffect, ReactNode } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import DeferredComponent from './DeferredComponent';

interface LazyMapComponentProps {
  children: ReactNode;
  delay?: number;
  mapTitle?: string;
}

// Static map placeholder
function MapPlaceholder({ title }: { title?: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-blue-200 flex items-center justify-center" dir="rtl">
      <div className="text-center p-8">
        <div className="relative mb-4">
          <MapPin className="h-16 w-16 text-blue-400 mx-auto animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-blue-900 mb-2">
          {title || 'جاري تحميل الخريطة...'}
        </h3>
        <p className="text-sm text-blue-700">
          يرجى الانتظار لحظات بينما نقوم بتحميل البيانات
        </p>
      </div>
    </div>
  );
}

/**
 * LazyMapComponent - Progressive loading wrapper for map components
 * Prevents memory spikes by deferring map initialization
 */
export default function LazyMapComponent({ children, delay = 800, mapTitle }: LazyMapComponentProps) {
  return (
    <DeferredComponent
      delay={delay}
      priority="low"
      placeholder={<MapPlaceholder title={mapTitle} />}
    >
      {children}
    </DeferredComponent>
  );
}
