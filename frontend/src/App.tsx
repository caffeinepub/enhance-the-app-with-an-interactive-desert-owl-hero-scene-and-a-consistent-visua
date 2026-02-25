import { lazy, Suspense } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import MainHeader from './components/MainHeader';
import ErrorBoundary from './components/ErrorBoundary';

const HomePage = lazy(() => import('./pages/HomePage'));
const BirdGallery = lazy(() => import('./components/BirdGallery'));
const BirdDetailsPage = lazy(() => import('./components/BirdDetailsPage'));
const AllLocationsMap = lazy(() => import('./components/AllLocationsMap'));
const EagleOwlPage = lazy(() => import('./components/EagleOwlPage'));
const StatisticsPage = lazy(() => import('./components/StatisticsPage'));
const ImageViewPage = lazy(() => import('./components/ImageViewPage'));
const PermissionManagement = lazy(() => import('./components/PermissionManagement'));
const BirdDataPage = lazy(() => import('./pages/BirdDataPage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center">
      <div className="text-6xl mb-4">🦉</div>
      <p className="text-foreground/70 text-lg font-arabic">جاري التحميل...</p>
    </div>
  </div>
);

function RootLayout() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <MainHeader />
      <Outlet />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <HomePage />
      </Suspense>
    </ErrorBoundary>
  ),
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/gallery',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <BirdGallery />
      </Suspense>
    </ErrorBoundary>
  ),
});

const birdDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bird/$name',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <BirdDetailsPage />
      </Suspense>
    </ErrorBoundary>
  ),
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <AllLocationsMap />
      </Suspense>
    </ErrorBoundary>
  ),
});

const eagleOwlRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/eagle-owl',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <EagleOwlPage />
      </Suspense>
    </ErrorBoundary>
  ),
});

const statisticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/statistics',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <StatisticsPage />
      </Suspense>
    </ErrorBoundary>
  ),
});

const imageViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/image-view',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <ImageViewPage />
      </Suspense>
    </ErrorBoundary>
  ),
});

const permissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/permissions',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <PermissionManagement />
      </Suspense>
    </ErrorBoundary>
  ),
});

const birdDataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data',
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <BirdDataPage />
      </Suspense>
    </ErrorBoundary>
  ),
});

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  galleryRoute,
  birdDetailsRoute,
  mapRoute,
  eagleOwlRoute,
  statisticsRoute,
  imageViewRoute,
  permissionsRoute,
  birdDataRoute,
  catchAllRoute,
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
