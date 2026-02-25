import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onEnter: () => void;
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onEnter();
    }, 600);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      // Auto-show after brief delay for animation
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-600 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, oklch(0.25 0.05 60) 0%, oklch(0.15 0.03 40) 50%, oklch(0.20 0.04 50) 100%)',
      }}
      dir="rtl"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'oklch(0.75 0.15 80)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: 'oklch(0.65 0.12 60)' }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg">
        {/* Owl Image */}
        <div className="mb-8 relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30 scale-150"
            style={{ background: 'oklch(0.75 0.15 80)' }}
          />
          <img
            src="/assets/generated/realistic-owl-perfect-transparent-clean.dim_400x400.png"
            alt="بوم البريمي"
            className="relative w-48 h-48 md:w-64 md:h-64 object-contain owl-transparent drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 30px oklch(0.75 0.15 80 / 0.5))' }}
          />
        </div>

        {/* Title */}
        <h1
          className="text-3xl md:text-4xl font-bold mb-3 font-arabic leading-tight"
          style={{ color: 'oklch(0.95 0.05 80)' }}
        >
          مواقع انتشار البوم
        </h1>
        <h2
          className="text-2xl md:text-3xl font-semibold mb-2 font-arabic"
          style={{ color: 'oklch(0.85 0.12 75)' }}
        >
          بمحافظة البريمي
        </h2>
        <p
          className="text-base md:text-lg mb-2 font-arabic opacity-80"
          style={{ color: 'oklch(0.80 0.08 70)' }}
        >
          Owl Distribution in Al Buraimi Governorate
        </p>
        <p
          className="text-sm mb-10 font-arabic opacity-60"
          style={{ color: 'oklch(0.75 0.06 65)' }}
        >
          سلطنة عُمان
        </p>

        {/* Enter Button */}
        <button
          onClick={handleEnter}
          className="group relative flex items-center gap-3 px-10 py-4 rounded-full font-arabic text-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, oklch(0.65 0.15 75), oklch(0.55 0.12 60))',
            color: 'oklch(0.98 0.02 80)',
            boxShadow: '0 8px 32px oklch(0.65 0.15 75 / 0.4)',
          }}
        >
          <span>ادخل إلى التطبيق</span>
          <span className="text-2xl group-hover:translate-x-[-4px] transition-transform">🦉</span>
        </button>
      </div>

      {/* Bottom decoration */}
      <div
        className="absolute bottom-8 text-sm font-arabic opacity-40"
        style={{ color: 'oklch(0.75 0.06 65)' }}
      >
        مشروع توثيق الطيور الجارحة الليلية
      </div>
    </div>
  );
}
