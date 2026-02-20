import { useState } from 'react';

interface SplashScreenProps {
  onEnter: () => void;
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleEnter = () => {
    setIsFadingOut(true);
    // Wait for fade animation to complete before calling onEnter
    setTimeout(() => {
      setIsVisible(false);
      onEnter();
    }, 800);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 flex flex-col items-center justify-center transition-opacity duration-800 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      dir="rtl"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-4">
        {/* Realistic Owl Image - Perfectly transparent background, large, clear, centered, and fixed with no container styling */}
        <div 
          className="owl-image-container relative w-80 h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] flex items-center justify-center"
          style={{
            background: 'transparent',
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none',
            outline: 'none'
          }}
        >
          <img 
            src="/assets/generated/realistic-owl-transparent-perfect-isolated.dim_400x400.png"
            alt="البومة"
            className="owl-image w-full h-full object-contain"
            style={{
              background: 'transparent',
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
              outline: 'none',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
            }}
          />
        </div>

        {/* Title in Arabic */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
            طائر البوم بمحافظة البريمي
          </h1>
          <p className="text-lg md:text-xl text-amber-100 drop-shadow-md">
            نظام تفاعلي لعرض وإدارة مواقع الطيور
          </p>
        </div>

        {/* Visual Enter Icon Button */}
        <button
          onClick={handleEnter}
          disabled={isFadingOut}
          className="group relative p-6 bg-white/90 backdrop-blur-sm rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          aria-label="دخول"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100 to-yellow-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <img
            src="/assets/generated/enter-icon-transparent.png"
            alt=""
            className="relative z-10 w-16 h-16 md:w-20 md:h-20 object-contain"
          />
          {/* Pulsing ring effect */}
          <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping"></div>
        </button>

        {/* Decorative elements */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 space-x-reverse">
          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
