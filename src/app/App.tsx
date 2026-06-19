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
const ProfilePage = lazy(() =>
  import('@/features/auth/pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);

// ── Dashboard ──
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);







// ── Orders ──
const OrdersPage = lazy(() =>
  import('@/features/orders/pages/OrdersPage').then((m) => ({ default: m.OrdersPage }))
);
const OrderDetailPage = lazy(() =>
  import('@/features/orders/pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage }))
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
const SupplierDetailPage = lazy(() =>
  import('@/features/suppliers/pages/SupplierDetailPage').then((m) => ({ default: m.SupplierDetailPage }))
);
const CreateSupplierPage = lazy(() =>
  import('@/features/suppliers/pages/CreateSupplierPage').then((m) => ({ default: m.CreateSupplierPage }))
);
const ProductsPage = lazy(() =>
  import('@/features/products/pages/ProductsPage').then((m) => ({ default: m.ProductsPage }))
);
const ProductDetailPage = lazy(() =>
  import('@/features/products/pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
);
const CreateProductPage = lazy(() =>
  import('@/features/products/pages/CreateProductPage').then((m) => ({ default: m.CreateProductPage }))
);
const EditProductPage = lazy(() =>
  import('@/features/products/pages/EditProductPage').then((m) => ({ default: m.EditProductPage }))
);
const RegionsPage = lazy(() =>
  import('@/features/regions/pages/RegionsPage').then((m) => ({ default: m.RegionsPage }))
);
const RegionDetailPage = lazy(() =>
  import('@/features/regions/pages/RegionDetailPage').then((m) => ({ default: m.RegionDetailPage }))
);
const CampaignsPage = lazy(() =>
  import('@/features/campaigns/pages/CampaignsPage').then((m) => ({ default: m.CampaignsPage }))
);
const CampaignDetailPage = lazy(() =>
  import('@/features/campaigns/pages/CampaignDetailPage').then((m) => ({ default: m.CampaignDetailPage }))
);
const CreateCampaignPage = lazy(() =>
  import('@/features/campaigns/pages/CreateCampaignPage').then((m) => ({ default: m.CreateCampaignPage }))
);
const TripsPage = lazy(() =>
  import('@/features/trips/pages/TripsPage').then((m) => ({ default: m.TripsPage }))
);
const TripDetailPage = lazy(() =>
  import('@/features/trips/pages/TripDetailPage').then((m) => ({ default: m.TripDetailPage }))
);
const CreateTripPage = lazy(() =>
  import('@/features/trips/pages/CreateTripPage').then((m) => ({ default: m.CreateTripPage }))
);

// ── Drivers ──
const DriversPage = lazy(() =>
  import('@/features/drivers/pages/DriversPage').then((m) => ({ default: m.DriversPage }))
);

// ── Complaints & Special Requests ──
const ComplaintDetailPage = lazy(() =>
  import('@/features/operations/pages/ComplaintDetailPage').then((m) => ({ default: m.ComplaintDetailPage }))
);
const SpecialRequestDetailPage = lazy(() =>
  import('@/features/operations/pages/SpecialRequestDetailPage').then((m) => ({ default: m.SpecialRequestDetailPage }))
);

// ── Warehouse Settings & Inventory ──
const WarehouseSettingsPage = lazy(() =>
  import('@/features/aggregation/pages/WarehouseSettingsPage').then((m) => ({ default: m.WarehouseSettingsPage }))
);
const InventoryPage = lazy(() =>
  import('@/features/aggregation/pages/InventoryPage').then((m) => ({ default: m.InventoryPage }))
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
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />



              {/* Admin pages */}
              <Route path={ROUTES.SUPPLIERS} element={<SuppliersPage />} />
              <Route path={ROUTES.SUPPLIER_CREATE} element={<CreateSupplierPage />} />
              <Route path={ROUTES.SUPPLIER_DETAIL(':supplierId')} element={<SupplierDetailPage />} />
              <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
              <Route path={ROUTES.PRODUCT_CREATE} element={<CreateProductPage />} />
              <Route path={ROUTES.PRODUCT_EDIT(':productId')} element={<EditProductPage />} />
              <Route path={ROUTES.PRODUCT_DETAIL(':productId')} element={<ProductDetailPage />} />
              <Route path={ROUTES.REGIONS} element={<RegionsPage />} />
              <Route path={ROUTES.REGION_DETAIL(':regionId')} element={<RegionDetailPage />} />
              <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
              <Route path={ROUTES.CAMPAIGN_DETAIL(':campaignId')} element={<CampaignDetailPage />} />
              <Route path={ROUTES.CAMPAIGN_CREATE} element={<CreateCampaignPage />} />
              <Route path={ROUTES.TRIPS} element={<TripsPage />} />
              <Route path={ROUTES.TRIP_DETAIL(':tripId')} element={<TripDetailPage />} />
              <Route path={ROUTES.TRIP_CREATE} element={<CreateTripPage />} />
              <Route path={ROUTES.DRIVERS} element={<DriversPage />} />

              {/* Orders */}
              <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
              <Route path={ROUTES.ORDER_DETAIL(':orderId')} element={<OrderDetailPage />} />

              {/* Operations */}
              <Route path={ROUTES.OPERATIONS} element={<OperationsPage />} />

              {/* Aggregation (warehouse) */}
              <Route path={ROUTES.AGGREGATION} element={<AggregationPage />} />
              <Route path={ROUTES.WAREHOUSE_SETTINGS} element={<WarehouseSettingsPage />} />
              <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />

              {/* Operations sub-pages */}
              <Route path={ROUTES.COMPLAINT_DETAIL(':complaintId')} element={<ComplaintDetailPage />} />
              <Route path={ROUTES.SPECIAL_REQUEST_DETAIL(':requestId')} element={<SpecialRequestDetailPage />} />

            </Route>
          </Route>

          {/* ── Catch-all 404 ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Providers>
  );
}
