import { Link, useParams } from '@tanstack/react-router';
import { useGetBirdDetails } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';

function AudioPlayer({ audioPath }: { audioPath: string }) {
  const { data: url } = useFileUrl(audioPath);
  if (!url) return null;
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-foreground mb-2">الملف الصوتي</h3>
      <audio controls src={url} className="w-full" />
    </div>
  );
}

function BirdImage({ imagePath, alt }: { imagePath: string; alt: string }) {
  const { data: url } = useFileUrl(imagePath);
  if (!url) return (
    <div className="w-full h-48 bg-muted rounded-xl flex items-center justify-center text-4xl">🦅</div>
  );
  return (
    <img src={url} alt={alt} className="w-full h-48 object-cover rounded-xl" />
  );
}

export default function BirdDetailsPage() {
  const { name } = useParams({ from: '/bird/$name' });
  const { data: bird, isLoading, error } = useGetBirdDetails(decodeURIComponent(name));

  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            {bird?.arabicName || decodeURIComponent(name)}
          </h1>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            <span>←</span>
            <span>الرئيسية</span>
          </Link>
        </div>

        {isLoading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
            <p className="text-destructive">حدث خطأ أثناء تحميل بيانات الطائر</p>
          </div>
        )}

        {!isLoading && !error && !bird && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-5xl mb-4">🦅</div>
            <p>لم يتم العثور على بيانات هذا الطائر</p>
          </div>
        )}

        {bird && (
          <div className="space-y-6">
            {/* Names */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">معلومات الطائر</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">الاسم العربي</p>
                  <p className="font-semibold text-foreground">{bird.arabicName}</p>
                </div>
                {bird.englishName && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">الاسم الإنجليزي</p>
                    <p className="font-semibold text-foreground">{bird.englishName}</p>
                  </div>
                )}
                {bird.scientificName && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">الاسم العلمي</p>
                    <p className="font-semibold text-foreground italic">{bird.scientificName}</p>
                  </div>
                )}
                {bird.localName && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">الاسم المحلي</p>
                    <p className="font-semibold text-foreground">{bird.localName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {bird.description && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-3">الوصف</h2>
                <p className="text-foreground leading-relaxed">{bird.description}</p>
              </div>
            )}

            {/* Notes */}
            {bird.notes && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-3">ملاحظات</h2>
                <p className="text-foreground leading-relaxed">{bird.notes}</p>
              </div>
            )}

            {/* Locations */}
            {bird.locations && bird.locations.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  مواقع الرصد ({bird.locations.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bird.locations.map((loc, index) => (
                    <div key={index} className="bg-muted/50 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">الموقع {index + 1}</p>
                      <p className="text-sm text-foreground">خط العرض: {loc.latitude.toFixed(4)}</p>
                      <p className="text-sm text-foreground">خط الطول: {loc.longitude.toFixed(4)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audio */}
            {bird.audioFile && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <AudioPlayer audioPath={bird.audioFile} />
              </div>
            )}

            {/* Sub Images */}
            {bird.subImages && bird.subImages.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  الصور ({bird.subImages.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {bird.subImages.map((imgPath, index) => (
                    <BirdImage key={index} imagePath={imgPath} alt={`${bird.arabicName} - صورة ${index + 1}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Return */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
          >
            <span>←</span>
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
