import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes/routes';
import { cn } from '@/utils/cn';
import { BasketDrawer } from '@/features/basket/components/BasketDrawer';

interface NavItem {
  to: string;
  label: string;
  roles?: Array<'admin' | 'operations' | 'aggregation' | 'supplier' | 'driver' | 'customer'>;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.USERS, label: 'Users', roles: ['admin', 'operations'] },
  { to: ROUTES.PRODUCTS, label: 'Products', roles: ['admin', 'operations', 'supplier'] },
  { to: ROUTES.ORDERS, label: 'Orders', roles: ['admin', 'operations', 'supplier'] },
  { to: ROUTES.TRIPS, label: 'Trips', roles: ['admin', 'operations'] },
  { to: ROUTES.AGGREGATION, label: 'Warehouse', roles: ['admin', 'aggregation'] },
  { to: ROUTES.CUSTOMER_CATALOG, label: 'Catalog', roles: ['customer'] },
  { to: ROUTES.CUSTOMER_ORDERS, label: 'My Orders', roles: ['customer'] },
  { to: ROUTES.DRIVER_TRIPS, label: 'My Trips', roles: ['driver'] },
  { to: ROUTES.SUPPLIER_PRODUCTS, label: 'My Products', roles: ['supplier'] },
  { to: ROUTES.CAMPAIGNS, label: 'Campaigns', roles: ['admin', 'operations'] },
  { to: ROUTES.REGIONS, label: 'Regions', roles: ['admin', 'operations'] },
  { to: ROUTES.SETTINGS, label: 'Settings' },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.roles) return true; // show for all roles
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <div className="flex h-screen">
      <BasketDrawer />
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">Marketplace</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'block px-4 py-2 rounded-lg transition-colors text-sm',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 truncate">{user?.email}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-300 mt-2 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
