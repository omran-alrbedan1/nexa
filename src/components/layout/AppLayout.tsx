import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes/routes';
import { cn } from '@/utils/cn';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  LayoutDashboard, ClipboardList, Truck, Warehouse, Users,
  Map, Megaphone, Package, Menu, Bell, Settings, X,
  HelpCircle, LogOut, ChevronRight, Search, User,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: Array<'admin' | 'operations' | 'aggregation'>;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { to: ROUTES.OPERATIONS, label: 'Operations', icon: <ClipboardList size={20} />, roles: ['operations'] },
  { to: ROUTES.ORDERS, label: 'Orders', icon: <ClipboardList size={20} />, roles: ['admin', 'operations'] },
  { to: ROUTES.TRIPS, label: 'Trips', icon: <Truck size={20} />, roles: ['admin', 'operations'] },
  { to: ROUTES.AGGREGATION, label: 'Warehouse', icon: <Warehouse size={20} />, roles: ['admin', 'aggregation'] },
  { to: ROUTES.SUPPLIERS, label: 'Suppliers', icon: <Users size={20} />, roles: ['admin'] },
  { to: ROUTES.REGIONS, label: 'Regions', icon: <Map size={20} />, roles: ['admin', 'operations'] },
  { to: ROUTES.CAMPAIGNS, label: 'Campaigns', icon: <Megaphone size={20} />, roles: ['admin', 'operations'] },
  { to: ROUTES.PRODUCTS, label: 'Products', icon: <Package size={20} />, roles: ['admin', 'operations'] },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role as 'admin' | 'operations' | 'aggregation');
  });

  const isActive = (path: string) => {
    if (path === ROUTES.DASHBOARD) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-page">
      {/* ── Sidebar Overlay (Mobile) ── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-40 h-screen flex flex-col',
          'bg-white border-r border-border-default shadow-card',
          'transition-transform duration-300 ease-in-out',
          'w-sidebar-width flex-shrink-0',
          isMobile && !sidebarOpen && '-translate-x-full',
          isMobile && sidebarOpen && 'translate-x-0',
          !isMobile && 'translate-x-0'
        )}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border-default">
          <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center text-white font-display font-bold text-lg shadow-sm">
            N
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-brand-primary-dark">
              NEXA Ops
            </h1>
            <p className="text-[11px] font-medium text-text-secondary font-body">
              Management Suite
            </p>
          </div>
          {isMobile && (
            <button onClick={closeSidebar} className="ml-auto p-1 text-text-secondary hover:text-text-primary rounded-md hover:bg-gray-100">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg font-body font-medium transition-all duration-200',
                'text-sm',
                isActive(item.to)
                  ? 'bg-brand-primary-light text-brand-primary font-bold'
                  : 'text-text-secondary hover:bg-bg-section-alt hover:text-text-primary'
              )}
            >
              <span className={cn(
                'flex-shrink-0',
                isActive(item.to) ? 'text-brand-primary' : 'text-text-tertiary'
              )}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive(item.to) && (
                <ChevronRight size={16} className="ml-auto text-brand-primary" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto border-t border-border-default p-3 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-bg-section-alt hover:text-text-primary transition-colors font-body font-medium">
            <HelpCircle size={20} className="text-text-tertiary" />
            Help Center
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-status-error hover:bg-brand-accent-light transition-colors font-body font-medium"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top Bar ── */}
        <header className="bg-white border-b border-border-default shadow-sm sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center justify-between h-header-height px-4 md:px-6">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={22} />
              </button>
              <div className="hidden md:block">
                <h2 className="font-display text-lg font-extrabold text-brand-primary">
                  NEXA Operations
                </h2>
              </div>
            </div>

            {/* Search - Desktop */}
            <div className="hidden md:flex relative flex-1 max-w-md mx-6">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search orders, trips, or regions..."
                className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-default rounded-full text-sm font-body text-text-primary outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light"
              />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <button className="relative p-2 text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary rounded-full transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-error rounded-full border border-white" />
              </button>
              <button className="p-2 text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary rounded-full transition-colors">
                <Settings size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-body text-xs font-bold ml-1 shadow-sm">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden px-4 pb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-full text-sm font-body text-text-primary outline-none transition-all focus:border-brand-primary"
              />
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-6 lg:p-8 max-w-container-max mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
