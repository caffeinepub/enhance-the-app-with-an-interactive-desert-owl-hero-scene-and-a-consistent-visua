import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetBirdDetails } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';

function AudioPlayer({ audioPath }: { audioPath: string }) {
  const { data: audioUrl } = useFileUrl(audioPath);
  if (!audioUrl) return null;
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-foreground mb-2">🎵 الصوت</h3>
      <audio controls className="w-full">
        <source src={audioUrl} />
        متصفحك لا يدعم تشغيل الصوت
      </audio>
    </div>
  );
}

function SubImageDisplay({ imagePath, index }: { imagePath: string; index: number }) {
  const { data: imageUrl } = useFileUrl(imagePath);
  if (!imageUrl) return null;
  return (
    <img
      src={imageUrl}
      alt={`صورة ${index + 1}`}
      className="w-full h-40 object-cover rounded-lg border border-border"
    />
  );
}

function MainImageDisplay({ imagePath }: { imagePath: string }) {
  const { data: imageUrl } = useFileUrl(imagePath);
  if (!imageUrl) {
    return (
      <div className="w-full h-64 bg-muted rounded-xl flex items-center justify-center">
        <span className="text-4xl">🦉</span>
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt="صورة الطائر"
      className="w-full h-64 object-cover rounded-xl border border-border"
    />
  );
}

export default function BirdDetailsPage() {
  // Route is /bird/$name — param key is "name"
  const { name } = useParams({ from: '/bird/$name' });
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name);
  const { data: bird, isLoading, error, refetch } = useGetBirdDetails(decodedName);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-spin inline-block">⏳</div>
          <p className="text-muted-foreground">جاري تحميل بيانات الطائر...</p>
        </div>
      </div>
    );
  }

  if (error || !bird) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center max-w-md">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-destructive font-medium mb-4">
            {error ? 'فشل تحميل بيانات الطائر' : 'الطائر غير موجود'}
          </p>
          <div className="flex gap-2 justify-center">
            {error && (
              <button
                onClick={() => refetch()}
                className="bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm"
              >
                إعادة المحاولة
              </button>
            )}
            <button
              onClick={() => navigate({ to: '/' })}
              className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg text-sm"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allImages = bird.subImages || [];
  const hasImages = allImages.length > 0;

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground truncate">{bird.arabicName}</h1>
          <button
            onClick={() => navigate({ to: '/' })}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            🏠 العودة للرئيسية
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Image Gallery */}
        {hasImages && (
          <section className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <MainImageDisplay imagePath={allImages[activeImageIndex]} />
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <SubImageDisplay imagePath={img} index={i} />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Bird Info */}
        <section className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">معلومات الطائر</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bird.arabicName && (
              <div>
                <span className="text-xs text-muted-foreground">الاسم العربي</span>
                <p className="text-sm font-medium text-foreground">{bird.arabicName}</p>
              </div>
            )}
            {bird.scientificName && (
              <div>
                <span className="text-xs text-muted-foreground">الاسم العلمي</span>
                <p className="text-sm font-medium text-foreground italic">{bird.scientificName}</p>
              </div>
            )}
            {bird.englishName && (
              <div>
                <span className="text-xs text-muted-foreground">الاسم الإنجليزي</span>
                <p className="text-sm font-medium text-foreground">{bird.englishName}</p>
              </div>
            )}
            {bird.localName && (
              <div>
                <span className="text-xs text-muted-foreground">الاسم المحلي</span>
                <p className="text-sm font-medium text-foreground">{bird.localName}</p>
              </div>
            )}
          </div>

          {bird.description && (
            <div className="mt-4">
              <span className="text-xs text-muted-foreground">الوصف</span>
              <p className="text-sm text-foreground mt-1 leading-relaxed">{bird.description}</p>
            </div>
          )}

          {bird.notes && (
            <div className="mt-4">
              <span className="text-xs text-muted-foreground">ملاحظات</span>
              <p className="text-sm text-foreground mt-1 leading-relaxed">{bird.notes}</p>
            </div>
          )}
        </section>

        {/* Locations */}
        {bird.locations && bird.locations.length > 0 && (
          <section className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-4">
              📍 المواقع ({bird.locations.length})
            </h2>
            <div className="space-y-3">
              {bird.locations.map((loc, i) => (
                <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      موقع {i + 1}
                    </span>
                    {loc.location && (
                      <span className="text-sm font-medium text-foreground">{loc.location}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {loc.governorate && (
                      <p className="text-sm text-foreground">الولاية: {loc.governorate}</p>
                    )}
                    {loc.mountainName && (
                      <p className="text-sm text-foreground">الجبل: {loc.mountainName}</p>
                    )}
                    {loc.valleyName && (
                      <p className="text-sm text-foreground">الوادي: {loc.valleyName}</p>
                    )}
                    {loc.coordinate && (
                      <>
                        <p className="text-sm text-foreground">
                          خط العرض: {loc.coordinate.latitude.toFixed(4)}
                        </p>
                        <p className="text-sm text-foreground">
                          خط الطول: {loc.coordinate.longitude.toFixed(4)}
                        </p>
                      </>
                    )}
                  </div>
                  {loc.notes && (
                    <p className="text-xs text-muted-foreground mt-2">{loc.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Audio */}
        {bird.audioFile && (
          <section className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <AudioPlayer audioPath={bird.audioFile} />
          </section>
        )}

        {/* Bottom Return Button */}
        <div className="flex justify-center pb-6">
          <button
            onClick={() => navigate({ to: '/' })}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            🏠 العودة للرئيسية
          </button>
        </div>
      </main>
    </div>
  );
}
