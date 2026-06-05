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
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);

// ── Dashboard ──
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);

// ── Users CRUD (admin/operations) ──
const UsersListPage = lazy(() =>
  import('@/features/users/pages/UsersListPage').then((m) => ({ default: m.UsersListPage }))
);
const UserCreatePage = lazy(() =>
  import('@/features/users/pages/UserCreatePage').then((m) => ({ default: m.UserCreatePage }))
);
const UserEditPage = lazy(() =>
  import('@/features/users/pages/UserEditPage').then((m) => ({ default: m.UserEditPage }))
);
const UserDetailPage = lazy(() =>
  import('@/features/users/pages/UserDetailPage').then((m) => ({ default: m.UserDetailPage }))
);

// ── Settings ──
const SettingsPage = lazy(() =>
  import('@/features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

// ── Catalog (Phase 4) ──
const CatalogPage = lazy(() =>
  import('@/features/products/pages/CatalogPage').then((m) => ({ default: m.CatalogPage }))
);
const ProductDetailPage = lazy(() =>
  import('@/features/products/pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
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
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

          {/* ── Authenticated routes (any role) ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

              {/* Dashboard — accessible by all roles */}
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

              {/* Users management — admin & operations only */}
              <Route
                element={<ProtectedRoute allowedRoles={['admin', 'operations']} />}
              >
                <Route path={ROUTES.USERS} element={<UsersListPage />} />
                <Route path={ROUTES.USER_CREATE} element={<UserCreatePage />} />
                <Route path={ROUTES.USER_EDIT(':userId')} element={<UserEditPage />} />
                <Route path={ROUTES.USER_DETAIL(':userId')} element={<UserDetailPage />} />
              </Route>

              {/* Settings */}
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />

              {/* ── Placeholder routes for future phases ── */}

              {/* Products */}
              <Route path={ROUTES.PRODUCTS} element={<PlaceholderPage title="Products" />} />
              <Route path={ROUTES.PRODUCT_CREATE} element={<PlaceholderPage title="Create Product" />} />
              <Route path={ROUTES.PRODUCT_EDIT(':productId')} element={<PlaceholderPage title="Edit Product" />} />
              <Route path={ROUTES.PRODUCT_DETAIL(':productId')} element={<PlaceholderPage title="Product Detail" />} />

              {/* Orders */}
              <Route path={ROUTES.ORDERS} element={<PlaceholderPage title="Orders" />} />
              <Route path={ROUTES.ORDER_DETAIL(':orderId')} element={<PlaceholderPage title="Order Detail" />} />

              {/* Trips */}
              <Route path={ROUTES.TRIPS} element={<PlaceholderPage title="Trips" />} />
              <Route path={ROUTES.TRIP_DETAIL(':tripId')} element={<PlaceholderPage title="Trip Detail" />} />

              {/* Regions */}
              <Route path={ROUTES.REGIONS} element={<PlaceholderPage title="Regions" />} />

              {/* Campaigns */}
              <Route path={ROUTES.CAMPAIGNS} element={<PlaceholderPage title="Campaigns" />} />

              {/* Aggregation (warehouse) */}
              <Route path={ROUTES.AGGREGATION} element={<PlaceholderPage title="Aggregation" />} />

              {/* Customer-specific */}
              <Route path={ROUTES.CUSTOMER_CATALOG} element={<CatalogPage />} />
              <Route path={ROUTES.PRODUCT_DETAIL(':productId')} element={<ProductDetailPage />} />
              <Route path={ROUTES.CUSTOMER_BASKET} element={<PlaceholderPage title="Basket" />} />
              <Route path={ROUTES.CUSTOMER_CHECKOUT} element={<PlaceholderPage title="Checkout" />} />
              <Route path={ROUTES.CUSTOMER_ORDERS} element={<PlaceholderPage title="My Orders" />} />
              <Route
                path={ROUTES.CUSTOMER_TRACKING(':orderId')}
                element={<PlaceholderPage title="Order Tracking" />}
              />

              {/* Supplier-specific */}
              <Route path={ROUTES.SUPPLIER_PRODUCTS} element={<PlaceholderPage title="My Products" />} />

              {/* Driver-specific */}
              <Route path={ROUTES.DRIVER_TRIPS} element={<PlaceholderPage title="My Trips" />} />
            </Route>
          </Route>

          {/* ── Catch-all 404 ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Providers>
  );
}
