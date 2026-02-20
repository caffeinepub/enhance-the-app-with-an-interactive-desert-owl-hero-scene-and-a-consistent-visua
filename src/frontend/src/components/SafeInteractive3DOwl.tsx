import { useState, useEffect } from 'react';
import DeferredComponent from './DeferredComponent';

interface SafeInteractive3DOwlProps {
  width?: string;
  height?: string;
  className?: string;
  enableZoom?: boolean;
  enableRotation?: boolean;
  autoRotate?: boolean;
}

// Static placeholder component
function StaticOwlPlaceholder({ width, height, className }: { width: string; height: string; className?: string }) {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ 
        width, 
        height,
        background: 'transparent',
        backgroundColor: 'transparent',
      }}
    >
      <img 
        src="/assets/generated/new-realistic-owl-perfect-transparent.dim_400x400.png"
        alt="البومة"
        className="w-full h-full object-contain"
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        loading="eager"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded" dir="rtl">
        جاري تحميل النموذج ثلاثي الأبعاد...
      </div>
    </div>
  );
}

export default function SafeInteractive3DOwl({
  width = '100%',
  height = '400px',
  className = '',
  enableZoom = false,
  enableRotation = false,
  autoRotate = false,
}: SafeInteractive3DOwlProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [Interactive3DOwl, setInteractive3DOwl] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Dynamically import the 3D component with memory optimization
        const module = await import('./Interactive3DOwl');
        
        if (mounted) {
          setInteractive3DOwl(() => module.default);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load Interactive3DOwl:', error);
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    // OPTIMIZED: Increased delay to 300ms to reduce initial memory pressure
    const timer = setTimeout(loadComponent, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Fallback: Static image
  if (hasError || !Interactive3DOwl) {
    return (
      <div 
        className={`relative flex items-center justify-center ${className}`}
        style={{ 
          width, 
          height,
          background: 'transparent',
          backgroundColor: 'transparent',
        }}
      >
        <img 
          src="/assets/generated/new-realistic-owl-perfect-transparent.dim_400x400.png"
          alt="البومة"
          className="w-full h-full object-contain"
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
          loading="eager"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {hasError && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded" dir="rtl">
            عرض ثابت
          </div>
        )}
      </div>
    );
  }

  // Loading state with static placeholder
  if (isLoading) {
    return <StaticOwlPlaceholder width={width} height={height} className={className} />;
  }

  // Render the actual 3D component wrapped in deferred loading with static placeholder
  try {
    return (
      <DeferredComponent 
        delay={500} 
        priority="low"
        placeholder={<StaticOwlPlaceholder width={width} height={height} className={className} />}
      >
        <Interactive3DOwl
          width={width}
          height={height}
          className={className}
          enableZoom={enableZoom}
          enableRotation={enableRotation}
          autoRotate={autoRotate}
        />
      </DeferredComponent>
    );
  } catch (error) {
    console.error('Error rendering Interactive3DOwl:', error);
    return (
      <div 
        className={`relative flex items-center justify-center ${className}`}
        style={{ 
          width, 
          height,
          background: 'transparent',
          backgroundColor: 'transparent',
        }}
      >
        <img 
          src="/assets/generated/new-realistic-owl-perfect-transparent.dim_400x400.png"
          alt="البومة"
          className="w-full h-full object-contain"
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
          }}
          loading="eager"
        />
      </div>
    );
  }
}
