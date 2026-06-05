import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Providers } from './providers';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { ROUTES } from '@/routes/routes';

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
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
const SettingsPage = lazy(() =>
  import('@/features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

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
      <ToastContainer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.USERS} element={<UsersListPage />} />
              <Route path={ROUTES.USER_CREATE} element={<UserCreatePage />} />
              <Route path={ROUTES.USER_EDIT(':userId')} element={<UserEditPage />} />
              <Route path={ROUTES.USER_DETAIL(':userId')} element={<UserDetailPage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Providers>
  );
}
