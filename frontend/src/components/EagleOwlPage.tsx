import { Link } from '@tanstack/react-router';
import { useGetAllBirdData, useGetAllLocationsWithNames } from '../hooks/useQueries';

const OWL_KEYWORDS = ['بومة', 'بوم', 'owl', 'bubo', 'عقاب', 'eagle'];

function isOwlBird(name: string): boolean {
  const lower = name.toLowerCase();
  return OWL_KEYWORDS.some((kw) => lower.includes(kw));
}

export default function EagleOwlPage() {
  const { data: allBirdData, isLoading: birdsLoading, error: birdsError, refetch } = useGetAllBirdData();
  const { data: allLocations, isLoading: locationsLoading } = useGetAllLocationsWithNames();

  const owlBirds = (allBirdData || []).filter(([name, bird]) =>
    isOwlBird(name) || isOwlBird(bird.arabicName) || isOwlBird(bird.englishName || '') || isOwlBird(bird.scientificName || '')
  );

  const owlLocations = (allLocations || []).filter((loc) => isOwlBird(loc.birdName));

  const isLoading = birdsLoading || locationsLoading;

  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">البومة العقاب</h1>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            <span>←</span>
            <span>الرئيسية</span>
          </Link>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-8 text-center">
          <img
            src="/assets/generated/new-realistic-owl-perfect-transparent.dim_400x400.png"
            alt="البومة العقاب"
            className="w-32 h-32 object-contain mx-auto mb-4"
          />
          <h2 className="text-xl font-bold text-amber-800 dark:text-amber-200 mb-2">
            البومة العقاب في محافظة البريمي
          </h2>
          <p className="text-amber-700 dark:text-amber-300 text-sm max-w-lg mx-auto">
            البومة العقاب (Bubo bubo) هي من أكبر أنواع البوم في العالم، وتُعدّ من الطيور الجارحة الليلية النادرة في سلطنة عُمان.
          </p>
        </div>

        {/* Error */}
        {birdsError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-destructive mb-3">حدث خطأ أثناء تحميل البيانات</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm hover:bg-destructive/90 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        )}

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-primary mb-2">{owlBirds.length}</div>
              <p className="text-muted-foreground">أنواع البوم المرصودة</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-amber-600 mb-2">{owlLocations.length}</div>
              <p className="text-muted-foreground">مواقع الرصد</p>
            </div>
          </div>
        )}

        {/* Owl Birds List */}
        {!isLoading && owlBirds.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">أنواع البوم المرصودة</h2>
            <div className="space-y-4">
              {owlBirds.map(([key, bird]) => (
                <div key={key} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground text-lg">{bird.arabicName}</h3>
                      {bird.englishName && (
                        <p className="text-muted-foreground text-sm">{bird.englishName}</p>
                      )}
                      {bird.scientificName && (
                        <p className="text-muted-foreground text-sm italic">{bird.scientificName}</p>
                      )}
                      {bird.description && (
                        <p className="text-foreground text-sm mt-2 leading-relaxed">{bird.description}</p>
                      )}
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div className="text-2xl font-bold text-primary">{bird.locations?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">موقع</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No owl data */}
        {!isLoading && owlBirds.length === 0 && !birdsError && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-5xl mb-4">🦉</div>
            <p>لا توجد بيانات عن البوم حالياً</p>
          </div>
        )}

        {/* Owl Locations */}
        {!isLoading && owlLocations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">مواقع رصد البوم</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {owlLocations.map((loc, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-4">
                  <p className="font-bold text-foreground mb-1">{loc.birdName}</p>
                  <p className="text-xs text-muted-foreground">خط العرض: {loc.coordinate.latitude.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground">خط الطول: {loc.coordinate.longitude.toFixed(4)}</p>
                </div>
              ))}
            </div>
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
