import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Home, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { useGetAllBirdData } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';

interface BirdImageProps {
  path: string;
  alt: string;
  className?: string;
}

function BirdImage({ path, alt, className }: BirdImageProps) {
  const { data: url } = useFileUrl(path);
  if (!url) return (
    <div className={`bg-muted flex items-center justify-center ${className}`}>
      <Image className="w-8 h-8 text-muted-foreground" />
    </div>
  );
  return <img src={url} alt={alt} className={className} />;
}

export default function BirdGallery() {
  const navigate = useNavigate();
  const { data: birdData, isLoading, error } = useGetAllBirdData();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBirds, setExpandedBirds] = useState<Set<string>>(new Set());

  const toggleExpand = (birdName: string) => {
    setExpandedBirds(prev => {
      const next = new Set(prev);
      if (next.has(birdName)) {
        next.delete(birdName);
      } else {
        next.add(birdName);
      }
      return next;
    });
  };

  const filteredBirds = birdData?.filter(([name, bird]) => {
    const q = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      bird.arabicName.toLowerCase().includes(q) ||
      bird.englishName.toLowerCase().includes(q) ||
      bird.scientificName.toLowerCase().includes(q)
    );
  }) ?? [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate({ to: '/' })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-arabic text-sm"
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>
            <h1 className="text-2xl font-bold text-foreground font-arabic">معرض الطيور</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن طائر..."
              className="w-full pr-10 pl-4 py-2.5 bg-background border border-border rounded-lg text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🦉</div>
            <p className="text-foreground/60 font-arabic">جاري تحميل البيانات...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-destructive font-arabic">حدث خطأ في تحميل البيانات</p>
          </div>
        )}

        {!isLoading && !error && filteredBirds.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-foreground/60 font-arabic">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات طيور'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBirds.map(([name, bird]) => {
            const isExpanded = expandedBirds.has(name);
            const hasImages = bird.subImages && bird.subImages.length > 0;

            return (
              <div
                key={name}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Main Image */}
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {hasImages ? (
                    <BirdImage
                      path={bird.subImages[0]}
                      alt={bird.arabicName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">🦉</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-foreground font-arabic mb-1">
                    {bird.arabicName || name}
                  </h3>
                  {bird.englishName && (
                    <p className="text-sm text-foreground/60 mb-1">{bird.englishName}</p>
                  )}
                  {bird.scientificName && (
                    <p className="text-xs text-foreground/40 italic mb-2">{bird.scientificName}</p>
                  )}
                  {bird.description && (
                    <p className="text-sm text-foreground/70 font-arabic line-clamp-2 mb-3">
                      {bird.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate({ to: '/bird/$name', params: { name } })}
                      className="flex-1 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-arabic transition-colors"
                    >
                      عرض التفاصيل
                    </button>

                    {hasImages && bird.subImages.length > 1 && (
                      <button
                        onClick={() => toggleExpand(name)}
                        className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                        title={isExpanded ? 'إخفاء الصور' : 'عرض المزيد'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded Images */}
                  {isExpanded && hasImages && bird.subImages.length > 1 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {bird.subImages.slice(1).map((imgPath, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <BirdImage
                            path={imgPath}
                            alt={`${bird.arabicName} ${idx + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
