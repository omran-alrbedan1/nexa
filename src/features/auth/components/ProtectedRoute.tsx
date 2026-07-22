import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes/routes';
import type { UserRole } from '@/types/marketplace';

interface ProtectedRouteProps {
  /** Roles allowed to access this route. If omitted, any authenticated user can access. */
  allowedRoles?: UserRole[];
  /** Permissions required to access this route. ANY match grants access. */
  requiredPermissions?: string[];
}

export function ProtectedRoute({ allowedRoles, requiredPermissions }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  // Permission guard — check if user has any of the required permissions
  if (requiredPermissions && requiredPermissions.length > 0 && user) {
    const hasAccess = requiredPermissions.some((p) => user.permissions.includes(p));
    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
            <h2 className="text-lg font-semibold mb-2">{t('auth.protected.accessDenied')}</h2>
            <p className="text-sm">
              {t('auth.protected.noPermission')}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate(ROUTES.LOGIN);
            }}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            {t('auth.protected.signInDifferent')}
          </button>
        </div>
      );
    }
  }

  // Legacy role guard — if allowedRoles is specified, check it
  if (allowedRoles && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <h2 className="text-lg font-semibold mb-2">{t('auth.protected.accessDenied')}</h2>
          <p className="text-sm">
            {t('auth.protected.signedInAs', { role: user.role, roles: allowedRoles.join(', ') })}
          </p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate(ROUTES.LOGIN);
          }}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          {t('auth.protected.signInDifferent')}
        </button>
      </div>
    );
  }

  return <Outlet />;
}
