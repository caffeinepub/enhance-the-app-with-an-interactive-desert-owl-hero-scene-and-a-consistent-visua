import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';

export default function ImageViewPage() {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    // Try to get image URL from history state
    const state = window.history.state as { imageUrl?: string } | null;
    if (state?.imageUrl) {
      setImageUrl(state.imageUrl);
    }
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => { setZoom(1); setRotation(0); };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50" dir="rtl">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomIn}
            className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
          >
            🔍+
          </button>
          <button
            onClick={handleZoomOut}
            className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
          >
            🔍-
          </button>
          <button
            onClick={handleRotate}
            className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
          >
            🔄 تدوير
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
          >
            ↺ إعادة تعيين
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
          >
            🏠 الرئيسية
          </Link>
          <button
            onClick={() => navigate({ to: -1 as any })}
            className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
          >
            ✕ إغلاق
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="عرض الصورة"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div className="text-white/50 text-center">
            <div className="text-5xl mb-4">🖼️</div>
            <p>لا توجد صورة للعرض</p>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-t border-white/10">
        <span className="text-white/50 text-sm">
          التكبير: {Math.round(zoom * 100)}% | الدوران: {rotation}°
        </span>
        <Link
          to="/"
          className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
