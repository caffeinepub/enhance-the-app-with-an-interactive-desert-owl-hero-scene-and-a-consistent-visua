import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Home, ChevronLeft, ChevronRight, Volume2, VolumeX, MapPin } from 'lucide-react';
import { useGetBirdDetails, useGetAudioFile } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';

interface ImageDisplayProps {
  path: string;
  alt: string;
  className?: string;
}

function ImageDisplay({ path, alt, className }: ImageDisplayProps) {
  const { data: url } = useFileUrl(path);
  if (!url) return (
    <div className={`bg-muted flex items-center justify-center ${className}`}>
      <span className="text-4xl">🦉</span>
    </div>
  );
  return <img src={url} alt={alt} className={className} />;
}

interface AudioPlayerProps {
  audioPath: string;
}

function AudioPlayer({ audioPath }: AudioPlayerProps) {
  const { data: audioUrl } = useFileUrl(audioPath);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!audioUrl) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
      >
        {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
      <audio
        src={audioUrl}
        controls
        className="flex-1"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}

export default function BirdDetailsPage() {
  const { name } = useParams({ from: '/bird/$name' });
  const navigate = useNavigate();
  const { data: bird, isLoading, error } = useGetBirdDetails(name);
  const { data: audioPath } = useGetAudioFile(name);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = bird?.subImages ?? [];

  const prevImage = () => setCurrentImageIndex(i => Math.max(0, i - 1));
  const nextImage = () => setCurrentImageIndex(i => Math.min(images.length - 1, i + 1));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="text-6xl mb-4">🦉</div>
          <p className="text-foreground/60 font-arabic">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !bird) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-destructive font-arabic mb-4">لم يتم العثور على بيانات الطائر</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-arabic mx-auto"
          >
            <Home className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-arabic text-sm"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
          <h1 className="text-xl font-bold text-foreground font-arabic">{bird.arabicName}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Image Carousel */}
        {images.length > 0 && (
          <div className="mb-8">
            <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden">
              <ImageDisplay
                path={images[currentImageIndex]}
                alt={`${bird.arabicName} - صورة ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    disabled={currentImageIndex === 0}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={currentImageIndex === images.length - 1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {images.map((imgPath, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <ImageDisplay
                      path={imgPath}
                      alt={`صورة ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bird Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground font-arabic mb-4">معلومات الطائر</h2>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-foreground/50 font-arabic">الاسم العربي</span>
                <p className="text-foreground font-arabic font-semibold">{bird.arabicName}</p>
              </div>
              {bird.englishName && (
                <div>
                  <span className="text-xs text-foreground/50">English Name</span>
                  <p className="text-foreground">{bird.englishName}</p>
                </div>
              )}
              {bird.scientificName && (
                <div>
                  <span className="text-xs text-foreground/50">Scientific Name</span>
                  <p className="text-foreground italic">{bird.scientificName}</p>
                </div>
              )}
            </div>
          </div>

          {bird.locations && bird.locations.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-foreground font-arabic mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>مواقع الرصد ({bird.locations.length})</span>
              </h2>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {bird.locations.map((loc, idx) => (
                  <div key={idx} className="text-sm text-foreground/70 font-arabic">
                    موقع {idx + 1}: {loc.latitude.toFixed(4)}°N, {loc.longitude.toFixed(4)}°E
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {bird.description && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-foreground font-arabic mb-3">الوصف</h2>
            <p className="text-foreground/80 font-arabic leading-relaxed">{bird.description}</p>
          </div>
        )}

        {/* Notes */}
        {bird.notes && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-foreground font-arabic mb-3">ملاحظات</h2>
            <p className="text-foreground/80 font-arabic leading-relaxed">{bird.notes}</p>
          </div>
        )}

        {/* Audio */}
        {audioPath && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-foreground font-arabic mb-3">الصوت</h2>
            <AudioPlayer audioPath={audioPath} />
          </div>
        )}

        {/* Return to Home */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate({ to: '/' })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-arabic font-semibold hover:bg-primary/90 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>العودة إلى الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
}
