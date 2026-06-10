import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Providers } from './providers';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { ROUTES } from '@/routes/routes';

// ── Auth pages ──
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);


// ── Dashboard ──
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);







// ── Operations ──
const OperationsPage = lazy(() =>
  import('@/features/operations/pages/OperationsPage').then((m) => ({ default: m.OperationsPage }))
);

// ── Aggregation / Warehouse ──
const AggregationPage = lazy(() =>
  import('@/features/aggregation/pages/AggregationPage').then((m) => ({ default: m.AggregationPage }))
);

// ── Admin pages ──
const SuppliersPage = lazy(() =>
  import('@/features/suppliers/pages/SuppliersPage').then((m) => ({ default: m.SuppliersPage }))
);
const ProductsPage = lazy(() =>
  import('@/features/products/pages/ProductsPage').then((m) => ({ default: m.ProductsPage }))
);
const RegionsPage = lazy(() =>
  import('@/features/regions/pages/RegionsPage').then((m) => ({ default: m.RegionsPage }))
);
const CampaignsPage = lazy(() =>
  import('@/features/campaigns/pages/CampaignsPage').then((m) => ({ default: m.CampaignsPage }))
);
const TripsPage = lazy(() =>
  import('@/features/trips/pages/TripsPage').then((m) => ({ default: m.TripsPage }))
);

// ── Shared components ──

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-gray-800">404</h1>
      <p className="text-gray-600 mt-2">Page not found</p>
      <Link to={ROUTES.DASHBOARD} className="mt-4 text-blue-600 hover:underline">
        Go to Dashboard
      </Link>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-lg">{title} — Coming soon</p>
    </div>
  );
}

export function App() {
  return (
    <Providers>
      <ToastContainer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public routes ── */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />


          {/* ── Authenticated routes (any role) ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

              {/* Dashboard — accessible by all roles */}
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />



              {/* Admin pages */}
              <Route path={ROUTES.SUPPLIERS} element={<SuppliersPage />} />
              <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
              <Route path={ROUTES.PRODUCT_CREATE} element={<PlaceholderPage title="Create Product" />} />
              <Route path={ROUTES.PRODUCT_EDIT(':productId')} element={<PlaceholderPage title="Edit Product" />} />
              <Route path={ROUTES.PRODUCT_DETAIL(':productId')} element={<PlaceholderPage title="Product Detail" />} />
              <Route path={ROUTES.REGIONS} element={<RegionsPage />} />
              <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
              <Route path={ROUTES.TRIPS} element={<TripsPage />} />
              <Route path={ROUTES.TRIP_DETAIL(':tripId')} element={<PlaceholderPage title="Trip Detail" />} />

              {/* Orders (still placeholder unless needed) */}
              <Route path={ROUTES.ORDERS} element={<PlaceholderPage title="Orders" />} />
              <Route path={ROUTES.ORDER_DETAIL(':orderId')} element={<PlaceholderPage title="Order Detail" />} />

              {/* Operations */}
              <Route path={ROUTES.OPERATIONS} element={<OperationsPage />} />

              {/* Aggregation (warehouse) */}
              <Route path={ROUTES.AGGREGATION} element={<AggregationPage />} />


            </Route>
          </Route>

          {/* ── Catch-all 404 ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Providers>
  );
}
