import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes/routes';
import type { UserRole } from '@/features/users/types/userTypes';

interface ProtectedRouteProps {
  /** Roles allowed to access this route. If omitted, any authenticated user can access. */
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Role guard — if allowedRoles is specified, check it
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-sm">
            You are signed in as <strong>{user.role}</strong> but this area requires one of the
            following roles: {allowedRoles.join(', ')}.
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            window.location.href = ROUTES.LOGIN;
          }}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Sign in with a different account
        </button>
      </div>
    );
  }

  return <Outlet />;
}
