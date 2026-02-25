import { useNavigate } from '@tanstack/react-router';
import { Home, MapPin, RefreshCw } from 'lucide-react';
import { useGetAllBirdData, useAllLocationsWithNames } from '../hooks/useQueries';

const OWL_KEYWORDS = ['بوم', 'owl', 'bubo', 'strix', 'athena', 'tyto', 'عقاب'];

export default function EagleOwlPage() {
  const navigate = useNavigate();
  const { data: birdData, isLoading: birdsLoading, error: birdsError, refetch } = useGetAllBirdData();
  const { data: locations } = useAllLocationsWithNames();

  const owlBirds = birdData?.filter(([name, bird]) => {
    const searchText = `${name} ${bird.arabicName} ${bird.englishName} ${bird.scientificName}`.toLowerCase();
    return OWL_KEYWORDS.some(kw => searchText.includes(kw.toLowerCase()));
  }) ?? [];

  const owlLocations = locations?.filter(loc => {
    const searchText = loc.birdName.toLowerCase();
    return OWL_KEYWORDS.some(kw => searchText.includes(kw.toLowerCase()));
  }) ?? [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-arabic text-sm"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
          <h1 className="text-xl font-bold text-foreground font-arabic">بوم العقاب</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">🦉</div>
            <h3 className="text-lg font-bold text-foreground font-arabic mb-2">بوم العقاب</h3>
            <p className="text-sm text-foreground/60 font-arabic">
              Bubo bubo - أكبر أنواع البوم في العالم
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">{owlBirds.length}</div>
            <p className="text-sm text-foreground/60 font-arabic">سجل موثق</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">{owlLocations.length}</div>
            <p className="text-sm text-foreground/60 font-arabic">موقع رصد</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground font-arabic mb-4">عن بوم العقاب</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/70 font-arabic leading-relaxed">
            <p>
              بوم العقاب (Bubo bubo) هو أكبر أنواع البوم في العالم، يتميز بأذنيه الريشيتين البارزتين وعينيه البرتقاليتين اللامعتين.
            </p>
            <p>
              يعيش في المناطق الصخرية والجبلية، ويتغذى على الثدييات الصغيرة والطيور. يُعدّ من الطيور الجارحة الليلية النادرة في محافظة البريمي.
            </p>
          </div>
        </div>

        {/* Loading / Error */}
        {birdsLoading && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-foreground/60 font-arabic">جاري تحميل البيانات...</p>
          </div>
        )}

        {birdsError && (
          <div className="text-center py-8">
            <p className="text-destructive font-arabic mb-3">حدث خطأ في تحميل البيانات</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-arabic text-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Owl Bird Records */}
        {!birdsLoading && owlBirds.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground font-arabic mb-4">سجلات البوم الموثقة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {owlBirds.map(([name, bird]) => (
                <div
                  key={name}
                  className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => navigate({ to: '/bird/$name', params: { name } })}
                >
                  <h3 className="font-bold text-foreground font-arabic mb-1">{bird.arabicName}</h3>
                  {bird.englishName && <p className="text-sm text-foreground/60 mb-1">{bird.englishName}</p>}
                  {bird.scientificName && <p className="text-xs text-foreground/40 italic mb-2">{bird.scientificName}</p>}
                  <div className="flex items-center gap-1 text-xs text-foreground/50 font-arabic">
                    <MapPin className="w-3 h-3" />
                    <span>{bird.locations.length} موقع رصد</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sighting Locations */}
        {owlLocations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground font-arabic mb-4">مواقع الرصد</h2>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-right font-arabic text-foreground/70">#</th>
                    <th className="px-4 py-3 text-right font-arabic text-foreground/70">اسم الطائر</th>
                    <th className="px-4 py-3 text-right font-arabic text-foreground/70">خط العرض</th>
                    <th className="px-4 py-3 text-right font-arabic text-foreground/70">خط الطول</th>
                  </tr>
                </thead>
                <tbody>
                  {owlLocations.map((loc, idx) => (
                    <tr key={idx} className="border-t border-border hover:bg-muted/50">
                      <td className="px-4 py-3 text-foreground/60">{idx + 1}</td>
                      <td className="px-4 py-3 font-arabic text-foreground">{loc.birdName}</td>
                      <td className="px-4 py-3 text-foreground/70">{loc.coordinate.latitude.toFixed(4)}</td>
                      <td className="px-4 py-3 text-foreground/70">{loc.coordinate.longitude.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
