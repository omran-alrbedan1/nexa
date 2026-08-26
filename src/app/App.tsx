import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Providers } from './providers';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
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
const TrustedPhonesPage = lazy(() =>
  import('@/features/suppliers/pages/TrustedPhonesPage').then((m) => ({ default: m.TrustedPhonesPage }))
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
const UnitsPage = lazy(() =>
  import('@/features/products/pages/UnitsPage').then((m) => ({ default: m.UnitsPage }))
);
const ProductSizesPage = lazy(() =>
  import('@/features/products/pages/ProductSizesPage').then((m) => ({ default: m.ProductSizesPage }))
);
const ColorsPage = lazy(() =>
  import('@/features/products/pages/ColorsPage').then((m) => ({ default: m.ColorsPage }))
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
const EditCampaignPage = lazy(() =>
  import('@/features/campaigns/pages/EditCampaignPage').then((m) => ({ default: m.EditCampaignPage }))
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
const PickupIssuesPage = lazy(() =>
  import('@/features/trips/pages/PickupIssuesPage').then((m) => ({ default: m.PickupIssuesPage }))
);
const CodHandoversPage = lazy(() =>
  import('@/features/trips/pages/CodHandoversPage').then((m) => ({ default: m.CodHandoversPage }))
);

// ── Drivers ──
const DriversPage = lazy(() =>
  import('@/features/drivers/pages/DriversPage').then((m) => ({ default: m.DriversPage }))
);
const DriverDetailPage = lazy(() =>
  import('@/features/drivers/pages/DriverDetailPage').then((m) => ({ default: m.DriverDetailPage }))
);

// ── Driver Monitor ──
const DriverMonitorPage = lazy(() =>
  import('@/features/delivery-monitor/pages/DriverMonitorPage').then((m) => ({ default: m.default }))
);

// ── Payments ──
const PaymentsPage = lazy(() =>
  import('@/features/payments/pages/PaymentsPage').then((m) => ({ default: m.PaymentsPage }))
);

// ── Support Tickets ──
const SupportTicketsPage = lazy(() =>
  import('@/features/support/pages/SupportTicketsPage').then((m) => ({ default: m.SupportTicketsPage }))
);
const SupportTicketDetailPage = lazy(() =>
  import('@/features/support/pages/SupportTicketDetailPage').then((m) => ({ default: m.SupportTicketDetailPage }))
);

// ── Special Orders ──
const SpecialOrdersPage = lazy(() =>
  import('@/features/special-orders/pages/SpecialOrdersPage').then((m) => ({ default: m.SpecialOrdersPage }))
);
const SpecialOrderDetailPage = lazy(() =>
  import('@/features/special-orders/pages/SpecialOrderDetailPage').then((m) => ({ default: m.SpecialOrderDetailPage }))
);

// ── Reports ──
const ReportsPage = lazy(() =>
  import('@/features/reports/pages/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);

// ── Customers ──
const CustomersPage = lazy(() =>
  import('@/features/customers/pages/CustomersPage').then((m) => ({ default: m.CustomersPage }))
);
const CustomerDetailPage = lazy(() =>
  import('@/features/customers/pages/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage }))
);

// ── Categories ──
const CategoriesPage = lazy(() =>
  import('@/features/categories/pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage }))
);
const CategoryFormPage = lazy(() =>
  import('@/features/categories/pages/CategoryFormPage').then((m) => ({ default: m.CategoryFormPage }))
);
const BusinessCategoryFormPage = lazy(() =>
  import('@/features/categories/pages/BusinessCategoryFormPage').then((m) => ({ default: m.BusinessCategoryFormPage }))
);

// ── Settings ──
const SettingsPage = lazy(() =>
  import('@/features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const RolesPage = lazy(() =>
  import('@/features/settings/pages/RolesPage').then((m) => ({ default: m.RolesPage }))
);
const StaffPage = lazy(() =>
  import('@/features/settings/pages/StaffPage').then((m) => ({ default: m.StaffPage }))
);
const BannersPage = lazy(() =>
  import('@/features/settings/pages/BannersPage').then((m) => ({ default: m.BannersPage }))
);
const NotificationsPage = lazy(() =>
  import('@/features/settings/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const AuditLogsPage = lazy(() =>
  import('@/features/settings/pages/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import('@/features/settings/pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const FaqSettingsPage = lazy(() =>
  import('@/features/settings/pages/FaqSettingsPage').then((m) => ({ default: m.FaqSettingsPage }))
);
const AboutNexaPage = lazy(() =>
  import('@/features/settings/pages/AboutNexaPage').then((m) => ({ default: m.AboutNexaPage }))
);
const SettingsNavigationPage = lazy(() =>
  import('@/features/settings/pages/SettingsNavigationPage').then((m) => ({ default: m.SettingsNavigationPage }))
);
const PrintBrandingPage = lazy(() =>
  import('@/features/settings/pages/PrintBrandingPage').then((m) => ({ default: m.PrintBrandingPage }))
);

// ── Complaints & Special Requests ──
const ComplaintDetailPage = lazy(() =>
  import('@/features/operations/pages/ComplaintDetailPage').then((m) => ({ default: m.ComplaintDetailPage }))
);
const SpecialRequestDetailPage = lazy(() =>
  import('@/features/operations/pages/SpecialRequestDetailPage').then((m) => ({ default: m.SpecialRequestDetailPage }))
);

// ── Warehouse Settings & Inventory ──
const InventoryPage = lazy(() =>
  import('@/features/aggregation/pages/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);

// ── Warehouses CRUD ──
const WarehousesPage = lazy(() =>
  import('@/features/warehouses/pages/WarehousesPage').then((m) => ({ default: m.WarehousesPage }))
);
const WarehouseFormPage = lazy(() =>
  import('@/features/warehouses/pages/WarehouseFormPage').then((m) => ({ default: m.WarehouseFormPage }))
);

// ── Geography & Locations ──
const CountriesPage = lazy(() =>
  import('@/features/locations/pages/CountriesPage').then((m) => ({ default: m.CountriesPage }))
);
const CountryDetailPage = lazy(() =>
  import('@/features/locations/pages/CountryDetailPage').then((m) => ({ default: m.CountryDetailPage }))
);
const ProvincesPage = lazy(() =>
  import('@/features/locations/pages/ProvincesPage').then((m) => ({ default: m.ProvincesPage }))
);
const ServiceRegionsPage = lazy(() =>
  import('@/features/locations/pages/ServiceRegionsPage').then((m) => ({ default: m.ServiceRegionsPage }))
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

export function App() {
  return (
    <Providers>
      <ErrorBoundary>
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

              {/* Dashboard — accessible by all roles with admin_panel.access */}
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />

              {/* Operations — accessible by operations role */}
              <Route path={ROUTES.OPERATIONS} element={<OperationsPage />} />

              {/* Aggregation (warehouse) — accessible by aggregation role */}
              <Route path={ROUTES.AGGREGATION} element={<AggregationPage />} />
              <Route path={ROUTES.WAREHOUSE_SETTINGS} element={<Navigate to={ROUTES.WAREHOUSES} replace />} />
              <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />

              {/* Operations sub-pages */}
              <Route path={ROUTES.COMPLAINT_DETAIL(':complaintId')} element={<ComplaintDetailPage />} />
              <Route path={ROUTES.SPECIAL_REQUEST_DETAIL(':requestId')} element={<SpecialRequestDetailPage />} />

              {/* Orders & payments — requires orders.view or orders.manage */}
              <Route element={<ProtectedRoute requiredPermissions={['orders.view', 'orders.manage']} />}>
                <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
                <Route path={ROUTES.ORDER_DETAIL(':orderId')} element={<OrderDetailPage />} />
                <Route path={ROUTES.PAYMENTS} element={<PaymentsPage />} />
                <Route path={ROUTES.PAYMENT_DETAIL(':paymentId')} element={<PaymentsPage />} />
                <Route path={ROUTES.SUPPORT_TICKETS} element={<SupportTicketsPage />} />
                <Route path={ROUTES.SUPPORT_TICKET_DETAIL(':ticketId')} element={<SupportTicketDetailPage />} />
                <Route path={ROUTES.SPECIAL_ORDERS} element={<SpecialOrdersPage />} />
                <Route path={ROUTES.SPECIAL_ORDER_DETAIL(':requestId')} element={<SpecialOrderDetailPage />} />
              </Route>

              {/* Customers — requires customers.view or customers.manage */}
              <Route element={<ProtectedRoute requiredPermissions={['customers.view', 'customers.manage']} />}>
                <Route path={ROUTES.CUSTOMERS} element={<CustomersPage />} />
                <Route path={ROUTES.CUSTOMER_DETAIL(':customerId')} element={<CustomerDetailPage />} />
              </Route>

              {/* Suppliers — requires suppliers.view */}
              <Route element={<ProtectedRoute requiredPermissions={['suppliers.view']} />}>
                <Route path={ROUTES.SUPPLIERS} element={<SuppliersPage />} />
                <Route path={ROUTES.SUPPLIER_CREATE} element={<CreateSupplierPage />} />
                <Route path={ROUTES.SUPPLIER_DETAIL(':supplierId')} element={<SupplierDetailPage />} />
                <Route path={ROUTES.SUPPLIER_TRUSTED_PHONES} element={<TrustedPhonesPage />} />
              </Route>

              {/* Products & campaigns & categories — requires products.view */}
              <Route element={<ProtectedRoute requiredPermissions={['products.view']} />}>
                <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
                <Route path={ROUTES.PRODUCT_CREATE} element={<CreateProductPage />} />
                <Route path={ROUTES.PRODUCT_EDIT(':productId')} element={<EditProductPage />} />
                <Route path={ROUTES.PRODUCT_DETAIL(':productId')} element={<ProductDetailPage />} />
                <Route path={ROUTES.UNITS} element={<UnitsPage />} />
                <Route path={ROUTES.PRODUCT_SIZES} element={<ProductSizesPage />} />
                <Route path={ROUTES.COLORS} element={<ColorsPage />} />
                <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
                <Route path={ROUTES.CAMPAIGN_DETAIL(':campaignId')} element={<CampaignDetailPage />} />
                <Route path={ROUTES.CAMPAIGN_CREATE} element={<CreateCampaignPage />} />
                <Route path={ROUTES.CAMPAIGN_EDIT(':campaignId')} element={<EditCampaignPage />} />
                <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
                <Route path={ROUTES.CATEGORIES_CREATE} element={<CategoryFormPage />} />
                <Route path={ROUTES.CATEGORIES_EDIT(':categoryId')} element={<CategoryFormPage />} />
                <Route path={ROUTES.BUSINESS_CATEGORIES_CREATE} element={<BusinessCategoryFormPage />} />
                <Route path={ROUTES.BUSINESS_CATEGORIES_EDIT(':businessCategoryId')} element={<BusinessCategoryFormPage />} />
              </Route>

              {/* Trips — requires trips.view or trips.manage */}
              <Route element={<ProtectedRoute requiredPermissions={['trips.view', 'trips.manage']} />}>
                <Route path={ROUTES.TRIPS} element={<TripsPage />} />
                <Route path={ROUTES.TRIP_DETAIL(':tripId')} element={<TripDetailPage />} />
                <Route path={ROUTES.TRIP_CREATE} element={<CreateTripPage />} />
                <Route path={ROUTES.PICKUP_ISSUES(':tripId')} element={<PickupIssuesPage />} />
                <Route path={ROUTES.COD_HANDOVERS(':tripId')} element={<CodHandoversPage />} />
                <Route path={ROUTES.DRIVER_MONITOR} element={<DriverMonitorPage />} />
              </Route>

              {/* Drivers — requires drivers.view */}
              <Route element={<ProtectedRoute requiredPermissions={['drivers.view']} />}>
                <Route path={ROUTES.DRIVERS} element={<DriversPage />} />
                <Route path={ROUTES.DRIVER_DETAIL(':driverId')} element={<DriverDetailPage />} />
              </Route>

              {/* Geography & Locations — requires settings.manage */}
              <Route element={<ProtectedRoute requiredPermissions={['settings.manage']} />}>
                <Route path={ROUTES.LOCATIONS} element={<Navigate to={ROUTES.COUNTRIES} replace />} />
                <Route path={ROUTES.COUNTRIES} element={<CountriesPage />} />
                <Route path={ROUTES.COUNTRY_DETAIL(':countryId')} element={<CountryDetailPage />} />
                <Route path={ROUTES.PROVINCES} element={<ProvincesPage />} />
                <Route path={ROUTES.SERVICE_REGIONS} element={<ServiceRegionsPage />} />
                <Route path={ROUTES.REGIONS} element={<RegionsPage />} />
                <Route path={ROUTES.REGION_DETAIL(':regionId')} element={<RegionDetailPage />} />
                <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                <Route path={ROUTES.SETTINGS_ROLES} element={<RolesPage />} />
                <Route path={ROUTES.SETTINGS_STAFF} element={<StaffPage />} />
                <Route path={ROUTES.SETTINGS_BANNERS} element={<BannersPage />} />
                <Route path={ROUTES.SETTINGS_NOTIFICATIONS} element={<NotificationsPage />} />
                <Route path={ROUTES.SETTINGS_AUDIT} element={<AuditLogsPage />} />
                <Route path={ROUTES.SETTINGS_PRIVACY_POLICY} element={<PrivacyPolicyPage />} />
                <Route path={ROUTES.SETTINGS_NAVIGATION} element={<SettingsNavigationPage />} />
                <Route path={ROUTES.SETTINGS_FAQ} element={<FaqSettingsPage />} />
                <Route path={ROUTES.SETTINGS_ABOUT_NEXA} element={<AboutNexaPage />} />
                <Route path={ROUTES.SETTINGS_PRINT} element={<PrintBrandingPage />} />
              </Route>

              {/* Delivery Slots — removed; trips are scheduled per day instead */}
              <Route element={<ProtectedRoute requiredPermissions={['settings.manage']} />}>
                <Route path={ROUTES.WAREHOUSES} element={<WarehousesPage />} />
                <Route path={ROUTES.WAREHOUSE_NEW} element={<WarehouseFormPage />} />
                <Route path={ROUTES.WAREHOUSE_EDIT} element={<WarehouseFormPage />} />
              </Route>

              {/* Reports — requires reports.view */}
              <Route element={<ProtectedRoute requiredPermissions={['reports.view']} />}>
                <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
              </Route>

            </Route>
          </Route>

          {/* ── Catch-all 404 ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
    </Providers>
  );
}
