import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useGetAllLocationsForMap } from '../hooks/useQueries';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { detectWebGL, normalizeBirdName, type WebGLSupport } from '../lib/webglDetector';

export default function EagleOwlPage() {
  const [webglSupport, setWebglSupport] = useState<WebGLSupport | null>(null);
  const { data: locations, isLoading, error } = useGetAllLocationsForMap('all');

  // Log eagle owl page data loading errors
  useEffect(() => {
    if (error) {
      console.error('❌ Eagle owl page data loading error:', {
        error,
        message: (error as any)?.message,
        timestamp: new Date().toISOString()
      });
    }
  }, [error]);

  // Log successful eagle owl page data load
  useEffect(() => {
    if (locations && !isLoading) {
      console.log('✅ Eagle owl page data loaded successfully:', {
        totalLocations: locations.length,
        timestamp: new Date().toISOString()
      });
    }
  }, [locations, isLoading]);

  useEffect(() => {
    const support = detectWebGL();
    setWebglSupport(support);
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">جاري تحميل بيانات البومة النسارية...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <div className="mx-auto max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <div className="space-y-2">
                <p className="font-semibold">فشل تحميل بيانات البومة النسارية</p>
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

  if (!locations || locations.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <div className="mx-auto max-w-2xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <p>لا توجد بيانات مواقع للبومة النسارية حالياً.</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold text-foreground mb-6 text-right">خريطة توزيع البومة النسارية</h1>
        <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
          <p className="text-muted-foreground">محتوى الصفحة قيد التطوير...</p>
        </div>
      </div>
    </div>
  );
}
