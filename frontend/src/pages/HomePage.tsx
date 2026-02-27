import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { useUploadMapImage, useGetActiveMapReference } from '../hooks/useQueries';
import { useFileUpload } from '../blob-storage/FileStorage';
import SplashScreen from '../components/SplashScreen';
import TeamDataTable from '../components/TeamDataTable';
import {
  Database,
  Image,
  Map,
  BarChart2,
  Bird,
  Upload,
  Shield,
  Heart,
} from 'lucide-react';

const NAV_CARDS = [
  {
    title: 'بيانات الطيور',
    description: 'عرض وإدارة بيانات الطيور المرصودة',
    icon: Database,
    path: '/data',
    color: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    title: 'معرض الصور',
    description: 'استعراض صور الطيور والمواقع',
    icon: Image,
    path: '/gallery',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    title: 'خريطة المواقع',
    description: 'خريطة تفاعلية لمواقع الرصد',
    icon: Map,
    path: '/map',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    title: 'الإحصائيات',
    description: 'إحصائيات وتحليلات البيانات',
    icon: BarChart2,
    path: '/statistics',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    title: 'البومة العقاب',
    description: 'صفحة مخصصة لطائر البومة العقاب',
    icon: Bird,
    path: '/eagle-owl',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    title: 'الصلاحيات',
    description: 'إدارة صلاحيات المستخدمين',
    icon: Shield,
    path: '/permissions',
    color: 'bg-red-50 border-red-200 hover:bg-red-100',
    iconColor: 'text-red-600',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const [showSplash, setShowSplash] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mapPreviewUrl, setMapPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading } = useFileUpload();
  const uploadMapMutation = useUploadMapImage();
  const { data: activeMapRef } = useGetActiveMapReference();

  useEffect(() => {
    const seen = sessionStorage.getItem('splashSeen');
    if (!seen) {
      setShowSplash(true);
    }
  }, []);

  useEffect(() => {
    if (actor && identity) {
      actor.isCallerAdmin().then(setIsAdmin).catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, [actor, identity]);

  // SplashScreen uses `onEnter` prop
  const handleSplashDone = () => {
    sessionStorage.setItem('splashSeen', 'true');
    setShowSplash(false);
  };

  const handleMapUpload = async (file: File) => {
    try {
      const previewUrl = URL.createObjectURL(file);
      setMapPreviewUrl(previewUrl);

      const path = `maps/al-buraimi-map-${Date.now()}.jpg`;
      const result = await uploadFile(path, file);
      await uploadMapMutation.mutateAsync(result.path);
    } catch (err) {
      console.error('Map upload error:', err);
      alert('حدث خطأ أثناء رفع الخريطة');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleMapUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleMapUpload(file);
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onEnter={handleSplashDone} />}

      <div className="min-h-screen bg-background" dir="rtl">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-amber-900/20 to-background py-16 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img
              src="/assets/generated/desert-owl-hero.dim_1600x900.png"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <img
                src="/assets/generated/new-realistic-owl-perfect-transparent.dim_400x400.png"
                alt="بومة"
                className="h-32 w-32 object-contain drop-shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              مشروع المسح الميداني لطائر البوم بمحافظة البريمي
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              توثيق وتتبع أنواع الطيور في محافظة البريمي بسلطنة عُمان
            </p>
          </div>
        </section>

        {/* Navigation Cards */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">أقسام المشروع</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {NAV_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.path}
                  onClick={() => navigate({ to: card.path })}
                  className={`${card.color} border rounded-xl p-5 text-right transition-all hover:shadow-md hover:-translate-y-0.5 group`}
                >
                  <div className={`${card.iconColor} mb-3`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-1">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Map Upload Section - Admin only */}
        {isAdmin && (
          <section className="max-w-4xl mx-auto px-4 pb-12">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">رفع خريطة المحافظة</h2>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {isUploading ? 'جاري الرفع...' : 'اسحب وأفلت الخريطة هنا أو انقر للاختيار'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {(mapPreviewUrl || activeMapRef) && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-foreground mb-2">الخريطة الحالية:</p>
                  <img
                    src={mapPreviewUrl || `/api/files/${activeMapRef}`}
                    alt="خريطة البريمي"
                    className="w-full max-h-64 object-contain rounded-lg border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Team Section */}
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">فريق العمل</h2>
          <TeamDataTable />
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-6 px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} أطلس طيور البريمي — مشروع المسح الميداني
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            Built with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'unknown-app')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
