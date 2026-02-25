import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Home, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';

export default function ImageViewPage() {
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Try to get image from search params or location state
  const imageUrl = (window.history.state?.usr?.imageUrl as string) ?? null;

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  const handleReset = () => { setZoom(1); setRotation(0); };

  return (
    <div className="min-h-screen bg-black flex flex-col" dir="rtl">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors font-arabic text-sm"
        >
          <Home className="w-4 h-4" />
          <span>الرئيسية</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-white text-sm min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="تدوير"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="إعادة تعيين"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Display */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="عرض الصورة"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div className="text-center text-white/50">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="font-arabic">لا توجد صورة للعرض</p>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="px-4 py-3 bg-black/80 backdrop-blur-sm border-t border-white/10 text-center">
        <button
          onClick={() => navigate({ to: '/' })}
          className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-arabic text-sm transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>العودة إلى الرئيسية</span>
        </button>
      </div>
    </div>
  );
}
