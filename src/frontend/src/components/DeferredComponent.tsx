import { useState, useEffect, useRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface DeferredComponentProps {
  children: ReactNode;
  delay?: number;
  fallback?: ReactNode;
  priority?: 'high' | 'medium' | 'low';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  placeholder?: ReactNode; // Static placeholder for heavy components
}

/**
 * DeferredComponent - Delays rendering of heavy components to reduce initial memory load
 * OPTIMIZED: Increased delays and added static placeholders
 */
export default function DeferredComponent({
  children,
  delay = 0,
  fallback,
  priority = 'medium',
  onLoad,
  onError,
  placeholder,
}: DeferredComponentProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // OPTIMIZED: Increased delays based on priority to reduce memory spikes
    const priorityDelays = {
      high: delay + 100,
      medium: delay + 300,
      low: delay + 500, // Increased from 300ms to 500ms
    };

    const actualDelay = priorityDelays[priority];

    const timer = setTimeout(() => {
      if (mountedRef.current) {
        try {
          setShouldRender(true);
          onLoad?.();
        } catch (error) {
          console.error('[DeferredComponent] Load error:', error);
          setHasError(true);
          onError?.(error as Error);
        }
      }
    }, actualDelay);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [delay, priority, onLoad, onError]);

  if (hasError) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200" dir="rtl">
        <p className="text-red-800 text-sm">حدث خطأ أثناء التحميل</p>
      </div>
    );
  }

  if (!shouldRender) {
    // Show static placeholder if provided, otherwise show loading
    if (placeholder) {
      return <>{placeholder}</>;
    }
    
    return fallback || (
      <div className="flex items-center justify-center p-8" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
