export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',

  // Dashboard (shared)
  DASHBOARD: '/dashboard',

  // Users management (admin/operations)
  USERS: '/users',
  USER_CREATE: '/users/create',
  USER_DETAIL: (userId: number | string) => `/users/${userId}`,
  USER_EDIT: (userId: number | string) => `/users/${userId}/edit`,

  // Settings
  SETTINGS: '/settings',

  // ── Placeholder routes for future phases ──

  // Products
  PRODUCTS: '/products',
  PRODUCT_CREATE: '/products/create',
  PRODUCT_EDIT: (productId: number | string) => `/products/${productId}/edit`,
  PRODUCT_DETAIL: (productId: number | string) => `/products/${productId}`,

  // Orders
  ORDERS: '/orders',
  ORDER_DETAIL: (orderId: number | string) => `/orders/${orderId}`,

  // Trips
  TRIPS: '/trips',
  TRIP_DETAIL: (tripId: number | string) => `/trips/${tripId}`,

  // Customer-specific
  CUSTOMER_CATALOG: '/catalog',
  CUSTOMER_BASKET: '/basket',
  CUSTOMER_CHECKOUT: '/checkout',
  CUSTOMER_ORDERS: '/my-orders',
  CUSTOMER_TRACKING: (orderId: number | string) => `/my-orders/${orderId}/track`,

  // Supplier-specific
  SUPPLIER_PRODUCTS: '/my-products',

  // Driver-specific
  DRIVER_TRIPS: '/my-trips',

  // Regions
  REGIONS: '/regions',

  // Seasonal campaigns
  CAMPAIGNS: '/campaigns',

  // Aggregation (warehouse)
  AGGREGATION: '/aggregation',
} as const;
