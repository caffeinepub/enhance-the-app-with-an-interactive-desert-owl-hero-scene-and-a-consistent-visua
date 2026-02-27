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
import MainHeader from './components/MainHeader';
import MemoryRecoveryNotification from './components/MemoryRecoveryNotification';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const HomePage = lazy(() => import('./pages/HomePage'));
const BirdDataPage = lazy(() => import('./pages/BirdDataPage'));
const BirdGallery = lazy(() => import('./components/BirdGallery'));
const AllLocationsMap = lazy(() => import('./components/AllLocationsMap'));
const BirdDetailsPage = lazy(() => import('./components/BirdDetailsPage'));
const EagleOwlPage = lazy(() => import('./components/EagleOwlPage'));
const StatisticsPage = lazy(() => import('./components/StatisticsPage'));
const ImageViewPage = lazy(() => import('./components/ImageViewPage'));
const PermissionManagement = lazy(() => import('./components/PermissionManagement'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center">
      <div className="text-4xl mb-4">🦉</div>
      <p className="text-muted-foreground text-lg">جاري التحميل...</p>
    </div>
  </div>
);

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground" dir="rtl">
        <MainHeader />
        <MemoryRecoveryNotification />
        <main>
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </QueryClientProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <HomePage />
    </Suspense>
  ),
});

const dataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <BirdDataPage />
    </Suspense>
  ),
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/gallery',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <BirdGallery />
    </Suspense>
  ),
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <AllLocationsMap />
    </Suspense>
  ),
});

const birdDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bird/$name',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <BirdDetailsPage />
    </Suspense>
  ),
});

const eagleOwlRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/eagle-owl',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <EagleOwlPage />
    </Suspense>
  ),
});

const statisticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/statistics',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <StatisticsPage />
    </Suspense>
  ),
});

const imageViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/image-view',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ImageViewPage />
    </Suspense>
  ),
});

const permissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/permissions',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <PermissionManagement />
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dataRoute,
  galleryRoute,
  mapRoute,
  birdDetailsRoute,
  eagleOwlRoute,
  statisticsRoute,
  imageViewRoute,
  permissionsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
