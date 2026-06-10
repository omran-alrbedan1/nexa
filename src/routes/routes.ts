export const ROUTES = {
  // Auth
  LOGIN: '/login',

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

  // Regions & delivery areas
  REGIONS: '/regions',

  // Seasonal campaigns
  CAMPAIGNS: '/campaigns',

  // Warehouse / aggregation
  AGGREGATION: '/aggregation',

  // Products management
  PRODUCTS: '/products',
  PRODUCT_CREATE: '/products/create',
  PRODUCT_EDIT: (productId: number | string) => `/products/${productId}/edit`,
  PRODUCT_DETAIL: (productId: number | string) => `/products/${productId}`,

  // Suppliers
  SUPPLIERS: '/suppliers',
} as const;
