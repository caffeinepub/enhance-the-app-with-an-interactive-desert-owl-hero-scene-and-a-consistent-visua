import { useState, useEffect, Suspense, lazy } from 'react';
import { RouterProvider, createRouter, createRootRoute, createRoute, redirect, Outlet } from '@tanstack/react-router';
import { Loader2, AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import MemoryRecoveryNotification from './components/MemoryRecoveryNotification';
import { useGetFileReferences, useForcedDataSync } from './hooks/useQueries';
import { useMemoryOptimization } from './hooks/useMemoryOptimization';

// Lazy load heavy components with progressive initialization
const HomePage = lazy(() => import('./pages/HomePage'));
const BirdDataTable = lazy(() => import('./components/BirdDataTable'));
const BirdGallery = lazy(() => import('./components/BirdGallery'));
const AllLocationsMap = lazy(() => import('./components/AllLocationsMap'));
const StatisticsPage = lazy(() => import('./components/StatisticsPage'));
const EagleOwlPage = lazy(() => import('./components/EagleOwlPage'));
const PermissionManagement = lazy(() => import('./components/PermissionManagement'));
const TeamDataTable = lazy(() => import('./components/TeamDataTable'));

interface OwlTableRow {
  id: string;
  localName: string;
  scientificName: string;
  location: string;
  mountainName: string;
  valleyName: string;
  state: string;
  coordinate40R: string;
  coordinateUTM: string;
  notes: string;
  birdName: string;
  easting: string;
  northing: string;
  zone: string;
  northernHemisphere: string;
  latitude: number;
  longitude: number;
  associatedImage?: string;
  briefDescription: string;
}

// OPTIMIZED: Enhanced loading fallback with static content
function LoadingFallback({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center" dir="rtl">
      <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md mx-4">
        <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{message}</h2>
        <p className="text-gray-600 text-lg">يرجى الانتظار لحظات...</p>
        <p className="text-gray-500 text-sm mt-4">يتم تحسين استخدام الذاكرة تلقائياً</p>
      </div>
    </div>
  );
}

// Error fallback component
function ErrorFallback({ error, onRetry, onGoHome }: { error?: Error; onRetry: () => void; onGoHome: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4" dir="rtl">
      <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md">
        <Alert className="border-2 border-red-400 bg-red-50 mb-6">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <AlertDescription className="text-red-900 font-bold text-lg">
            ⚠️ حدث خطأ أثناء تحميل التطبيق
          </AlertDescription>
        </Alert>
        <p className="text-gray-700 mb-6 text-base">
          عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
        </p>
        {error && (
          <details className="mb-6 p-4 bg-gray-100 rounded-lg text-right">
            <summary className="cursor-pointer text-gray-700 font-medium mb-2">
              تفاصيل الخطأ
            </summary>
            <pre className="text-xs text-gray-600 overflow-auto max-h-32 mt-2 p-2 bg-white rounded">
              {error.message}
            </pre>
          </details>
        )}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onRetry}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-base"
          >
            <RefreshCw className="h-5 w-5 ml-2" />
            إعادة المحاولة
          </Button>
          <Button
            onClick={onGoHome}
            variant="outline"
            size="lg"
            className="w-full border-2 border-gray-300 hover:bg-gray-100 font-bold py-3 text-base"
          >
            <Home className="h-5 w-5 ml-2" />
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}

// Not found redirect component
function NotFoundRedirect() {
  useEffect(() => {
    window.location.href = '/';
  }, []);
  
  return <LoadingFallback message="جاري إعادة التوجيه..." />;
}

// Global state for sharing data between routes
let globalOwlTableData: OwlTableRow[] = [];
let globalSelectedBirdForMap: string | null = null;

// Root layout component with forced data sync
function RootLayout() {
  const [showRecoveryNotification, setShowRecoveryNotification] = useState(false);

  // Force data sync on app load to clear old cached data
  useForcedDataSync();

  // OPTIMIZED: Enable memory optimization with reduced thresholds
  const { 
    showRecoveryNotification: memoryRecoveryNotification, 
    setShowRecoveryNotification: setMemoryRecoveryNotification,
  } = useMemoryOptimization({
    enableMonitoring: true,
    enableAutoRecovery: true,
    showNotifications: true,
  });

  useEffect(() => {
    setShowRecoveryNotification(memoryRecoveryNotification);
  }, [memoryRecoveryNotification]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white" dir="rtl">
        {/* Memory Recovery Notification */}
        <MemoryRecoveryNotification 
          show={showRecoveryNotification}
          onDismiss={() => {
            setShowRecoveryNotification(false);
            setMemoryRecoveryNotification(false);
          }}
        />
        
        <main>
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
}

// Create router outside component
const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback message="جاري تحميل الصفحة الرئيسية..." />}>
        <HomePage />
      </Suspense>
    </ErrorBoundary>
  ),
});

const dataTableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data-table',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback message="جاري تحميل جدول البيانات..." />}>
        <BirdDataTable
          owlTableData={globalOwlTableData}
          onOwlDataUpdate={(newData: OwlTableRow[]) => { globalOwlTableData = newData; }}
          uploadedFiles={[]}
        />
      </Suspense>
    </ErrorBoundary>
  ),
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/gallery',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback message="جاري تحميل المعرض..." />}>
        <BirdGallery
          onShowBirdOnMap={(birdName: string) => { globalSelectedBirdForMap = birdName; }}
          birdTableData={globalOwlTableData}
        />
      </Suspense>
    </ErrorBoundary>
  ),
});

const allLocationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/all-locations',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback message="جاري تحميل الخريطة..." />}>
        <AllLocationsMap />
      </Suspense>
    </ErrorBoundary>
  ),
});

const statisticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/statistics',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback message="جاري تحميل الإحصائيات..." />}>
        <StatisticsPage />
      </Suspense>
    </ErrorBoundary>
  ),
});

const eagleOwlRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/eagle-owl',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback message="جاري تحميل خريطة البوم..." />}>
        <EagleOwlPage />
      </Suspense>
    </ErrorBoundary>
  ),
});

const permissionManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/permission-management',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback message="جاري تحميل إدارة الصلاحيات..." />}>
        <PermissionManagement />
      </Suspense>
    </ErrorBoundary>
  ),
});

const teamDataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/team-data',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback message="جاري تحميل بيانات الفريق..." />}>
        <TeamDataTable />
      </Suspense>
    </ErrorBoundary>
  ),
});

// Catch-all route that redirects to homepage
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dataTableRoute,
  galleryRoute,
  allLocationsRoute,
  statisticsRoute,
  eagleOwlRoute,
  permissionManagementRoute,
  teamDataRoute,
  notFoundRoute,
]);

const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadDelay: 200,
  defaultNotFoundComponent: NotFoundRedirect,
});

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [owlTableData, setOwlTableData] = useState<OwlTableRow[]>([]);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [forceShowApp, setForceShowApp] = useState(false);
  const [appError, setAppError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: uploadedFiles = [], isLoading: filesLoading, error: filesError, refetch: refetchFiles } = useGetFileReferences();

  // Update global state when data changes
  useEffect(() => {
    globalOwlTableData = owlTableData;
  }, [owlTableData]);

  // Check if splash screen was already shown
  useEffect(() => {
    try {
      const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
      if (hasSeenSplash === 'true') {
        setShowSplash(false);
      }
    } catch (error) {
      console.error('[App] Session storage error:', error);
      setShowSplash(false);
    }
  }, []);

  // OPTIMIZED: Increased timeout for slower connections
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 10000); // Increased to 10 seconds

    return () => clearTimeout(timer);
  }, []);

  // Mark app as initialized once data is loaded or timeout occurs
  useEffect(() => {
    if (!filesLoading || loadingTimeout || forceShowApp) {
      setIsInitialized(true);
    }
  }, [filesLoading, loadingTimeout, forceShowApp]);

  const handleSplashComplete = () => {
    try {
      setShowSplash(false);
      sessionStorage.setItem('hasSeenSplash', 'true');
    } catch (error) {
      console.error('[App] Failed to save splash state:', error);
      setShowSplash(false);
    }
  };

  const handleRetry = () => {
    setLoadingTimeout(false);
    setForceShowApp(false);
    setAppError(null);
    refetchFiles();
  };

  const handleGoHome = () => {
    try {
      window.location.href = '/';
    } catch (error) {
      console.error('[App] Navigation error:', error);
      window.location.reload();
    }
  };

  // Show splash screen
  if (showSplash) {
    return (
      <ErrorBoundary>
        <SplashScreen onEnter={handleSplashComplete} />
      </ErrorBoundary>
    );
  }

  // Show loading state
  if (!isInitialized && !appError) {
    return <LoadingFallback message="جاري تحميل التطبيق..." />;
  }

  // Show error state if loading failed after timeout
  if (loadingTimeout && !forceShowApp && filesError) {
    return (
      <ErrorFallback 
        error={filesError as Error}
        onRetry={handleRetry}
        onGoHome={handleGoHome}
      />
    );
  }

  // Show app error if any
  if (appError) {
    return (
      <ErrorFallback 
        error={appError}
        onRetry={handleRetry}
        onGoHome={handleGoHome}
      />
    );
  }

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
