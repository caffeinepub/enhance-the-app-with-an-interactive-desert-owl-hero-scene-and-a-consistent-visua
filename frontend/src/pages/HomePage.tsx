import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import SplashScreen from '../components/SplashScreen';
import TeamDataTable from '../components/TeamDataTable';
import StaticAlBuraimiMap from '../components/StaticAlBuraimiMap';

const NAV_CARDS = [
  {
    title: 'معرض الصور',
    description: 'استعرض صور الطيور المرصودة في محافظة البريمي',
    icon: '🖼️',
    link: '/gallery',
    color: 'from-amber-500 to-orange-600',
  },
  {
    title: 'بيانات الطيور',
    description: 'جدول بيانات شامل لجميع الطيور المرصودة',
    icon: '📊',
    link: '/data',
    color: 'from-green-500 to-emerald-600',
  },
  {
    title: 'خريطة المواقع',
    description: 'خريطة تفاعلية تعرض مواقع رصد الطيور',
    icon: '🗺️',
    link: '/map',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    title: 'البومة العقاب',
    description: 'معلومات تفصيلية عن البومة العقاب في البريمي',
    icon: '🦉',
    link: '/eagle-owl',
    color: 'from-purple-500 to-violet-600',
  },
  {
    title: 'الإحصائيات',
    description: 'إحصائيات ومخططات بيانية لأعداد الطيور',
    icon: '📈',
    link: '/statistics',
    color: 'from-rose-500 to-pink-600',
  },
  {
    title: 'إدارة الصلاحيات',
    description: 'إدارة أدوار المستخدمين والصلاحيات',
    icon: '🔐',
    link: '/permissions',
    color: 'from-slate-500 to-gray-600',
  },
];

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (!hasSeenSplash) {
      setShowSplash(true);
    }
  }, []);

  // SplashScreen uses `onEnter` prop
  const handleSplashEnter = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  const handleOwlClick = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/owl.mp3');
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  if (showSplash) {
    return <SplashScreen onEnter={handleSplashEnter} />;
  }

  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div
            className="inline-block cursor-pointer hover:scale-105 transition-transform duration-300 mb-6"
            onClick={handleOwlClick}
            title="انقر للاستماع"
          >
            <img
              src="/assets/generated/new-realistic-owl-perfect-transparent.dim_400x400.png"
              alt="بومة البريمي"
              className="w-40 h-40 md:w-56 md:h-56 object-contain mx-auto drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4 leading-tight">
            طيور محافظة البريمي
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            دليل شامل لرصد وتوثيق الطيور في محافظة البريمي بسلطنة عُمان
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/gallery"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-lg"
            >
              استعرض المعرض
            </Link>
            <Link
              to="/data"
              className="px-8 py-3 bg-secondary text-secondary-foreground rounded-full font-semibold hover:bg-secondary/80 transition-colors shadow-lg"
            >
              عرض البيانات
            </Link>
          </div>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
            استكشف المحتوى
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {NAV_CARDS.map((card) => (
              <Link
                key={card.link}
                to={card.link}
                className="group block p-6 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} text-white text-2xl mb-4 group-hover:scale-110 transition-transform`}
                >
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-2">{card.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Static Map Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
            خريطة محافظة البريمي
          </h2>
          <StaticAlBuraimiMap />
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
            فريق العمل
          </h2>
          <TeamDataTable />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} طيور محافظة البريمي. جميع الحقوق محفوظة.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
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
