import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import SplashScreen from '../components/SplashScreen';
import TeamDataTable from '../components/TeamDataTable';
import { Upload, MapPin, X } from 'lucide-react';

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

const MAP_STORAGE_KEY = 'customMapImage';

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [customMapImage, setCustomMapImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (!hasSeenSplash) {
      setShowSplash(true);
    }
    // Load saved map from localStorage
    const savedMap = localStorage.getItem(MAP_STORAGE_KEY);
    if (savedMap) {
      setCustomMapImage(savedMap);
    }
  }, []);

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

  const handleMapFileChange = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        localStorage.setItem(MAP_STORAGE_KEY, dataUrl);
        setCustomMapImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleMapFileChange(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveMap = () => {
    localStorage.removeItem(MAP_STORAGE_KEY);
    setCustomMapImage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleMapFileChange(file);
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
            مشروع المسح الميداني لطائر البوم بمحافظة البريمي
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

      {/* Map Upload Section */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-7 h-7 text-primary" />
              خريطة المحافظة
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md"
              >
                <Upload className="w-4 h-4" />
                رفع الخريطة
              </button>
              {customMapImage && (
                <button
                  onClick={handleRemoveMap}
                  className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-semibold text-sm hover:bg-destructive/20 transition-colors border border-destructive/30"
                >
                  <X className="w-4 h-4" />
                  إزالة
                </button>
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Map display / upload area */}
          {customMapImage ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-xl">
              <img
                src={customMapImage}
                alt="خريطة محافظة البريمي"
                className="w-full object-contain max-h-[600px] bg-amber-50"
              />
              <div className="absolute bottom-3 left-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/60 text-white rounded-lg text-xs hover:bg-black/80 transition-colors backdrop-blur-sm"
                >
                  <Upload className="w-3 h-3" />
                  تغيير الخريطة
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
                ${isDragging
                  ? 'border-primary bg-primary/10 scale-[1.01]'
                  : 'border-amber-300 bg-amber-50/50 hover:border-primary hover:bg-primary/5'
                }
              `}
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-amber-800 mb-1">
                  ارفع خريطة المحافظة
                </p>
                <p className="text-sm text-amber-600">
                  اضغط هنا أو اسحب وأفلت صورة الخريطة
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  يدعم: JPG, PNG, WebP, GIF
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md"
              >
                <Upload className="w-4 h-4" />
                اختر ملف الخريطة
              </button>
            </div>
          )}
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
