export const ROUTES = {
  // Auth
  LOGIN: '/login',

  // Profile
  PROFILE: '/profile',

  // Dashboard
  DASHBOARD: '/dashboard',

  // Operations (full-page view)
  OPERATIONS: '/operations',

  // ── Placeholder routes for future dashboard phases ──

  // Orders
  ORDERS: '/orders',
  ORDER_DETAIL: (orderId: number | string) => `/orders/${orderId}`,

  // Trips
  TRIPS: '/trips',
  TRIP_DETAIL: (tripId: number | string) => `/trips/${tripId}`,
  TRIP_CREATE: '/trips/create',
  PICKUP_ISSUES: (tripId: number | string) => `/trips/${tripId}/pickup-issues`,
  COD_HANDOVERS: (tripId: number | string) => `/trips/${tripId}/cod-handovers`,

  // Regions & delivery areas
  REGIONS: '/regions',
  REGION_DETAIL: (regionId: number | string) => `/regions/${regionId}`,

  // Geography & Locations
  COUNTRIES: '/locations/countries',
  COUNTRY_DETAIL: (countryId: number | string) => `/locations/countries/${countryId}`,
  PROVINCES: '/locations/provinces',
  SERVICE_REGIONS: '/locations/service-regions',

  // Geography main entry
  LOCATIONS: '/locations',

  // Seasonal campaigns
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_CREATE: '/campaigns/create',
  CAMPAIGN_DETAIL: (campaignId: number | string) => `/campaigns/${campaignId}`,
  CAMPAIGN_EDIT: (campaignId: number | string) => `/campaigns/${campaignId}/edit`,

  // Warehouse / aggregation
  AGGREGATION: '/aggregation',
  WAREHOUSE_SETTINGS: '/warehouse/settings',
  WAREHOUSES: '/warehouses',
  WAREHOUSE_NEW: '/warehouses/new',
  WAREHOUSE_EDIT: '/warehouses/:id/edit',
  INVENTORY: '/inventory',

  // Complaints & Special Requests
  COMPLAINT_DETAIL: (complaintId: number | string) => `/complaints/${complaintId}`,
  SPECIAL_REQUEST_DETAIL: (requestId: number | string) => `/special-requests/${requestId}`,

  // Dedicated Special Orders
  SPECIAL_ORDERS: '/special-orders',
  SPECIAL_ORDER_DETAIL: (id: number | string) => `/special-orders/${id}`,

  // Products management
  PRODUCTS: '/products',
  PRODUCT_CREATE: '/products/create',
  PRODUCT_EDIT: (productId: number | string) => `/products/${productId}/edit`,
  PRODUCT_DETAIL: (productId: number | string) => `/products/${productId}`,

  // Product units
  UNITS: '/units',
  COLORS: '/colors',

  // Suppliers
  SUPPLIERS: '/suppliers',
  SUPPLIER_CREATE: '/suppliers/create',
  SUPPLIER_DETAIL: (supplierId: number | string) => `/suppliers/${supplierId}`,
  SUPPLIER_TRUSTED_PHONES: '/suppliers/trusted-phones',

  // Drivers
  DRIVERS: '/drivers',

  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: (customerId: number | string) => `/customers/${customerId}`,

  // Payments
  PAYMENTS: '/payments',
  PAYMENT_DETAIL: (paymentId: number | string) => `/payments/${paymentId}`,

  // Support Tickets
  SUPPORT_TICKETS: '/support',
  SUPPORT_TICKET_DETAIL: (ticketId: number | string) => `/support/${ticketId}`,

  // Categories
  CATEGORIES: '/categories',
  CATEGORIES_CREATE: '/categories/create',
  CATEGORIES_EDIT: (categoryId: number | string) => `/categories/${categoryId}/edit`,
  BUSINESS_CATEGORIES_CREATE: '/categories/business/create',
  BUSINESS_CATEGORIES_EDIT: (businessCategoryId: number | string) => `/categories/business/${businessCategoryId}/edit`,

  // Reports
  REPORTS: '/reports',

  // Driver detail
  DRIVER_DETAIL: (driverId: number | string) => `/drivers/${driverId}`,

  // Driver Monitor
  DRIVER_MONITOR: '/driver-monitor',

  // Settings
  SETTINGS: '/settings',
  SETTINGS_ROLES: '/settings/roles',
  SETTINGS_STAFF: '/settings/staff',
  SETTINGS_BANNERS: '/settings/banners',
  SETTINGS_CANCELLATION_REASONS: '/settings/cancellation-reasons',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_AUDIT: '/settings/audit',
  SETTINGS_PRIVACY_POLICY: '/settings/privacy-policy',
  SETTINGS_NAVIGATION: '/settings/navigation',
  SETTINGS_FAQ: '/settings/faq',
  SETTINGS_ABOUT_NEXA: '/settings/about-nexa',
  SETTINGS_PRINT: '/settings/print-branding',
} as const;
