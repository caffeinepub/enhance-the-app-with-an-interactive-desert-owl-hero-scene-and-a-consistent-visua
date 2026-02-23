import { useMemo, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { useGetAllBirdDetails, useGetLocationCountByBird, useTotalStatistics, useForcedDataSync } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export default function StatisticsPage() {
  const { data: allBirdData, isLoading: birdsLoading, error: birdsError } = useGetAllBirdDetails();
  const { data: locationCounts, isLoading: locationsLoading, error: locationsError } = useGetLocationCountByBird();
  const { totalBirds, totalLocations, isLoading: statsLoading } = useTotalStatistics();

  // Force data synchronization on mount
  useForcedDataSync();

  // Log statistics loading errors
  useEffect(() => {
    if (birdsError) {
      console.error('❌ Statistics birds data loading error:', {
        error: birdsError,
        message: (birdsError as any)?.message,
        timestamp: new Date().toISOString()
      });
    }
    if (locationsError) {
      console.error('❌ Statistics locations data loading error:', {
        error: locationsError,
        message: (locationsError as any)?.message,
        timestamp: new Date().toISOString()
      });
    }
  }, [birdsError, locationsError]);

  // Log successful statistics load
  useEffect(() => {
    if (allBirdData && locationCounts && !birdsLoading && !locationsLoading) {
      console.log('✅ Statistics data loaded successfully:', {
        totalBirds: allBirdData.length,
        totalLocationRecords: locationCounts.length,
        timestamp: new Date().toISOString()
      });
    }
  }, [allBirdData, locationCounts, birdsLoading, locationsLoading]);

  const speciesDistribution = useMemo(() => {
    if (!locationCounts) return [];
    return locationCounts.map(([name, count]) => ({
      name,
      value: Number(count)
    }));
  }, [locationCounts]);

  const imageAudioStats = useMemo(() => {
    if (!allBirdData) return [];
    
    const withImages = allBirdData.filter(([_, bird]) => bird.subImages.length > 0).length;
    const withAudio = allBirdData.filter(([_, bird]) => bird.audioFile).length;
    const withBoth = allBirdData.filter(([_, bird]) => bird.subImages.length > 0 && bird.audioFile).length;
    
    return [
      { name: 'مع صور', value: withImages },
      { name: 'مع صوت', value: withAudio },
      { name: 'مع صور وصوت', value: withBoth }
    ];
  }, [allBirdData]);

  const handleDownloadChart = () => {
    const chartElement = document.querySelector('.recharts-wrapper');
    if (!chartElement) return;

    // Simple download implementation
    toast.info('يتم تحضير الرسم البياني للتنزيل...', {
      duration: 2000,
      position: 'bottom-center',
    });
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (birdsLoading || locationsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  if (birdsError || locationsError) {
    return (
      <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
        <div className="mx-auto max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <div className="space-y-2">
                <p className="font-semibold">فشل تحميل بيانات الإحصائيات</p>
                <p className="text-sm">تعذر الاتصال بالخادم أو قاعدة البيانات. يرجى المحاولة مرة أخرى.</p>
                <Button onClick={handleRetry} variant="outline" size="sm" className="mt-2">
                  إعادة المحاولة
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!allBirdData || allBirdData.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
        <div className="mx-auto max-w-2xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <p>لا توجد بيانات إحصائية متاحة حالياً.</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">الإحصائيات</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">إجمالي الأنواع</h3>
            <p className="text-4xl font-bold text-foreground">{Number(totalBirds)}</p>
          </div>
          <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">إجمالي المواقع</h3>
            <p className="text-4xl font-bold text-foreground">{Number(totalLocations)}</p>
          </div>
          <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">متوسط المواقع لكل نوع</h3>
            <p className="text-4xl font-bold text-foreground">
              {Number(totalBirds) > 0 ? (Number(totalLocations) / Number(totalBirds)).toFixed(1) : 0}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-8">
          {/* Species Distribution Bar Chart */}
          <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">توزيع الأنواع حسب المواقع</h2>
              <Button onClick={handleDownloadChart} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                تنزيل الرسم البياني
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={speciesDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  style={{ 
                    fontSize: '14px',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="عدد المواقع" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Image and Audio Statistics Pie Chart */}
          <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-4">إحصائيات الوسائط</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={imageAudioStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {imageAudioStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
