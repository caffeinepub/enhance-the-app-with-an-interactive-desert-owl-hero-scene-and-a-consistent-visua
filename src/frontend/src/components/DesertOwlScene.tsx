import React, { useState, useEffect } from 'react';
import { detectWebGL } from '../lib/webglDetector';
import { REQUIRED_ASSETS } from '../lib/requiredAssets';

export default function DesertOwlScene() {
  const [webglSupport, setWebglSupport] = useState<{ supported: boolean; shouldUseFallback: boolean } | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      const support = detectWebGL();
      setWebglSupport(support);
    } catch (error) {
      console.error('WebGL detection error:', error);
      setHasError(true);
    }
  }, []);

  // Loading state
  if (!webglSupport) {
    return (
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-b from-amber-100 to-amber-50 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-amber-800 dark:text-amber-200 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Always use fallback to static image to avoid memory issues during build
  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-b from-amber-100 to-amber-50 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden">
      <img
        src={REQUIRED_ASSETS.DESERT_OWL_HERO}
        alt="مشهد البومة الصحراوية"
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
          طيور البوم في صحراء البريمي
        </h2>
      </div>
    </div>
  );
}
