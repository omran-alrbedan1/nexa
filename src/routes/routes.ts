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

  // Regions & delivery areas
  REGIONS: '/regions',
  REGION_DETAIL: (regionId: number | string) => `/regions/${regionId}`,

  // Seasonal campaigns
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_CREATE: '/campaigns/create',
  CAMPAIGN_DETAIL: (campaignId: number | string) => `/campaigns/${campaignId}`,

  // Warehouse / aggregation
  AGGREGATION: '/aggregation',
  WAREHOUSE_SETTINGS: '/warehouse/settings',
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

  // Suppliers
  SUPPLIERS: '/suppliers',
  SUPPLIER_CREATE: '/suppliers/create',
  SUPPLIER_DETAIL: (supplierId: number | string) => `/suppliers/${supplierId}`,

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

  // Reports
  REPORTS: '/reports',

  // Driver detail
  DRIVER_DETAIL: (driverId: number | string) => `/drivers/${driverId}`,

  // Settings
  SETTINGS: '/settings',
  SETTINGS_ROLES: '/settings/roles',
  SETTINGS_STAFF: '/settings/staff',
  SETTINGS_BANNERS: '/settings/banners',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_AUDIT: '/settings/audit',
  SETTINGS_PRIVACY_POLICY: '/settings/privacy-policy',
} as const;
