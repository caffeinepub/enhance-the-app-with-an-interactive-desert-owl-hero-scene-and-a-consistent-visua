import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SplashScreen from '../components/SplashScreen';
import StaticAlBuraimiMap from '../components/StaticAlBuraimiMap';
import TeamDataTable from '../components/TeamDataTable';

const SPLASH_SHOWN_KEY = 'splash_shown_v1';

export default function HomePage() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem(SPLASH_SHOWN_KEY);
  });

  const handleEnter = () => {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, 'true');
    setShowSplash(false);
  };

  useEffect(() => {
    if (!showSplash) {
      sessionStorage.setItem(SPLASH_SHOWN_KEY, 'true');
    }
  }, [showSplash]);

  if (showSplash) {
    return <SplashScreen onEnter={handleEnter} />;
  }

  return (
    <main className="min-h-screen bg-background" dir="rtl">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/20 via-background to-background py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/assets/generated/realistic-owl-perfect-transparent-clean.dim_400x400.png"
              alt="بوم البريمي"
              className="w-32 h-32 object-contain owl-transparent drop-shadow-2xl"
            />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 font-arabic leading-tight">
            مواقع انتشار البوم
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-primary mb-6 font-arabic">
            بمحافظة البريمي
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto font-arabic leading-relaxed">
            توثيق علمي شامل لمواقع انتشار البوم في محافظة البريمي بسلطنة عُمان
          </p>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8 font-arabic">
            استكشف التطبيق
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button
              onClick={() => navigate({ to: '/data' })}
              className="nav-card group flex flex-col items-center p-6 bg-card border border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">🐦</span>
              <span className="text-sm font-semibold text-foreground font-arabic text-center">البيانات</span>
            </button>

            <button
              onClick={() => navigate({ to: '/gallery' })}
              className="nav-card group flex flex-col items-center p-6 bg-card border border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">🖼️</span>
              <span className="text-sm font-semibold text-foreground font-arabic text-center">معرض الصور</span>
            </button>

            <button
              onClick={() => navigate({ to: '/map' })}
              className="nav-card group flex flex-col items-center p-6 bg-card border border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">🗺️</span>
              <span className="text-sm font-semibold text-foreground font-arabic text-center">خريطة المواقع</span>
            </button>

            <button
              onClick={() => navigate({ to: '/eagle-owl' })}
              className="nav-card group flex flex-col items-center p-6 bg-card border border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">🦉</span>
              <span className="text-sm font-semibold text-foreground font-arabic text-center">بوم العقاب</span>
            </button>

            <button
              onClick={() => navigate({ to: '/statistics' })}
              className="nav-card group flex flex-col items-center p-6 bg-card border border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">📊</span>
              <span className="text-sm font-semibold text-foreground font-arabic text-center">الإحصائيات</span>
            </button>

            <button
              onClick={() => navigate({ to: '/permissions' })}
              className="nav-card group flex flex-col items-center p-6 bg-card border border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">🔐</span>
              <span className="text-sm font-semibold text-foreground font-arabic text-center">الصلاحيات</span>
            </button>
          </div>
        </div>
      </section>

      {/* Al Buraimi Map */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground text-center mb-6 font-arabic">
            خريطة محافظة البريمي
          </h3>
          <StaticAlBuraimiMap />
        </div>
      </section>

      {/* Team Section */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground text-center mb-6 font-arabic">
            فريق العمل
          </h3>
          <TeamDataTable />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4 mt-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-foreground/60 text-sm font-arabic mb-2">
            © {new Date().getFullYear()} مواقع انتشار البوم بمحافظة البريمي
          </p>
          <p className="text-foreground/50 text-xs">
            Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'unknown-app')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
