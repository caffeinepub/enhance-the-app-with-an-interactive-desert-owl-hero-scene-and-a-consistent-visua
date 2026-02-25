import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  Link,
} from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import MainHeader from './components/MainHeader';
import MemoryRecoveryNotification from './components/MemoryRecoveryNotification';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
});

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const BirdDataPage = lazy(() => import('./pages/BirdDataPage'));
const BirdGallery = lazy(() => import('./components/BirdGallery'));
const BirdDetailsPage = lazy(() => import('./components/BirdDetailsPage'));
const AllLocationsMap = lazy(() => import('./components/AllLocationsMap'));
const EagleOwlPage = lazy(() => import('./components/EagleOwlPage'));
const StatisticsPage = lazy(() => import('./components/StatisticsPage'));
const ImageViewPage = lazy(() => import('./components/ImageViewPage'));
const PermissionManagement = lazy(() => import('./components/PermissionManagement'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground font-arabic">جاري التحميل...</p>
    </div>
  </div>
);

// Root layout component
function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRecoveryNotification />
      <MainHeader />
      <Suspense fallback={<LoadingFallback />}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Suspense>
    </QueryClientProvider>
  );
}

// Route definitions
const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground" dir="rtl">
      <h1 className="text-4xl font-bold mb-4">٤٠٤</h1>
      <p className="text-xl mb-6 text-muted-foreground">الصفحة غير موجودة</p>
      <Link to="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
        العودة للرئيسية
      </Link>
    </div>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary>
        <HomePage />
      </ErrorBoundary>
    </Suspense>
  ),
});

const dataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary>
        <BirdDataPage />
      </ErrorBoundary>
    </Suspense>
  ),
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/gallery',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary>
        <BirdGallery />
      </ErrorBoundary>
    </Suspense>
  ),
});

const birdDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bird/$name',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary>
        <BirdDetailsPage />
      </ErrorBoundary>
    </Suspense>
  ),
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary>
        <AllLocationsMap />
      </ErrorBoundary>
    </Suspense>
  ),
});

const eagleOwlRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/eagle-owl',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary>
        <EagleOwlPage />
      </ErrorBoundary>
    </Suspense>
  ),
});

const statisticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/statistics',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary>
        <StatisticsPage />
      </ErrorBoundary>
    </Suspense>
  ),
});

const imageViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/image-view',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary>
        <ImageViewPage />
      </ErrorBoundary>
    </Suspense>
  ),
});

const permissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/permissions',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary>
        <PermissionManagement />
      </ErrorBoundary>
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  dataRoute,
  galleryRoute,
  birdDetailsRoute,
  mapRoute,
  eagleOwlRoute,
  statisticsRoute,
  imageViewRoute,
  permissionsRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
