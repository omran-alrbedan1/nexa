export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  USER_CREATE: '/users/create',
  USER_DETAIL: (userId: number | string) => `/users/${userId}`,
  USER_EDIT: (userId: number | string) => `/users/${userId}/edit`,
  SETTINGS: '/settings',
} as const;
