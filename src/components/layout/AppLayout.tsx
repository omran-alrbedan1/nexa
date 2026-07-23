import { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
// import { CurrencySwitch } from '@/components/ui/CurrencySwitch';
import { CommandPalette, useCommandPalette } from '@/components/ui/CommandPalette';
import { ROUTES } from '@/routes/routes';
import { cn } from '@/utils/cn';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNavConfigStore } from '@/stores/navConfigStore';
import { DEFAULT_NAV_CONFIG, ICON_MAP, resolveLabel, getItemTo, type NavGroupConfig, type NavItemConfig } from '@/config/navigation';
import {
  Menu, Bell, X, LogOut, ChevronRight, ChevronDown, Search, Sun, Moon,
} from 'lucide-react';

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();

  const customLabels = useNavConfigStore((s) => s.customLabels);
  const groupOrder = useNavConfigStore((s) => s.groupOrder);
  const itemOrder = useNavConfigStore((s) => s.itemOrder);
  const expandedGroups = useNavConfigStore((s) => s.expandedGroups);
  const toggleExpanded = useNavConfigStore((s) => s.toggleExpanded);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isItemActive = useCallback((item: NavItemConfig) => {
    const { path, search } = getItemTo(item);
    if (location.pathname !== path) return false;
    if (!search) return true;
    const params = new URLSearchParams(search);
    const currentParams = new URLSearchParams(location.search);
    for (const [key, value] of params) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  }, [location.pathname, location.search]);

  const isGroupActive = useCallback((group: NavGroupConfig) => {
    return group.items.some((item) => isItemActive(item));
  }, [isItemActive]);

  const closeSidebar = () => setSidebarOpen(false);

  const visibleGroups = groupOrder
    .map((gid) => DEFAULT_NAV_CONFIG.find((g) => g.id === gid)!)
    .filter(Boolean)
    .filter((group) => {
      if (!group.roles) return true;
      if (!user) return false;
      return group.roles.includes(user.role as 'admin' | 'operations' | 'aggregation');
    })
    .map((group) => {
      const orderedItems = itemOrder[group.id] || group.items.map((i) => i.id);
      const visibleItems = orderedItems
        .map((iid) => group.items.find((i) => i.id === iid)!)
        .filter(Boolean)
        .filter((item) => {
          if (!item.roles) return true;
          if (!user) return false;
          return item.roles.includes(user.role as 'admin' | 'operations' | 'aggregation');
        });
      return { group, visibleItems };
    })
    .filter(({ visibleItems }) => visibleItems.length > 0);

  const renderGroupItem = (item: NavItemConfig) => {
    const Icon = ICON_MAP[item.icon];
    const label = resolveLabel(item.id, item.label, customLabels, t);
    const active = isItemActive(item);
    return (
      <NavLink
        key={item.id}
        to={item.to}
        onClick={closeSidebar}
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-lg font-body font-medium transition-all duration-200',
          'text-sm',
          active
            ? 'bg-brand-primary-light text-brand-primary font-bold'
            : 'text-text-secondary hover:bg-bg-section-alt hover:text-text-primary'
        )}
      >
        <span className={cn('flex-shrink-0', active ? 'text-brand-primary' : 'text-text-tertiary')}>
          {Icon ? <Icon size={20} /> : null}
        </span>
        <span>{label}</span>
        {active && <ChevronRight size={16} className="ml-auto text-brand-primary" />}
      </NavLink>
    );
  };

  const renderGroup = (group: NavGroupConfig, visibleItems: NavItemConfig[]) => {
    const isSingle = visibleItems.length === 1 && group.items.length === 1;

    if (isSingle) {
      return renderGroupItem(visibleItems[0]);
    }

    const Icon = ICON_MAP[group.icon];
    const label = resolveLabel(group.id, group.label, customLabels, t);
    const isExpanded = expandedGroups.includes(group.id) || isGroupActive(group);

    return (
      <div key={group.id}>
        <button
          onClick={() => toggleExpanded(group.id)}
          className={cn(
            'flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-body font-medium transition-all duration-200 text-sm text-left',
            isGroupActive(group)
              ? 'bg-brand-primary-light text-brand-primary font-bold'
              : 'text-text-secondary hover:bg-bg-section-alt hover:text-text-primary'
          )}
        >
          <span className={cn('flex-shrink-0', isGroupActive(group) ? 'text-brand-primary' : 'text-text-tertiary')}>
            {Icon ? <Icon size={20} /> : null}
          </span>
          <span className="flex-1">{label}</span>
          {isExpanded ? <ChevronDown size={16} className="text-text-tertiary" /> : <ChevronRight size={16} className="text-text-tertiary" />}
        </button>
        {isExpanded && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-border-default/40 pl-3">
            {visibleItems.map((item) => renderGroupItem(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-page">
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm" onClick={closeSidebar} />
      )}

      <aside
        className={cn(
          'fixed md:sticky top-0 start-0 z-40 h-screen flex flex-col',
          'bg-white border-r border-border-default shadow-card',
          'transition-transform duration-300 ease-in-out',
          'w-sidebar-width flex-shrink-0',
          isMobile && !sidebarOpen && 'sidebar-closed',
          isMobile && sidebarOpen && 'sidebar-open',
          !isMobile && 'sidebar-open'
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border-default">
          <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center text-white font-display font-bold text-lg shadow-sm">
            N
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-brand-primary-dark">
              {'NEXA ' + (user?.role === 'admin' ? 'Admin' : user?.role === 'aggregation' ? 'Warehouse' : 'Ops')}
            </h1>
            <p className="text-[11px] font-medium text-text-secondary font-body">
              {user?.role === 'admin' ? 'Management' : user?.role === 'aggregation' ? 'Fulfillment' : 'Management Suite'}
            </p>
          </div>
          {isMobile && (
            <button onClick={closeSidebar} className="ml-auto p-1 text-text-secondary hover:text-text-primary rounded-md hover:bg-gray-100">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-3 space-y-0.5">
          {visibleGroups.map(({ group, visibleItems }) => renderGroup(group, visibleItems))}
        </nav>

        <div className="mt-auto border-t border-border-default p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-status-error hover:bg-brand-accent-light transition-colors font-body font-medium"
          >
            <LogOut size={20} />
            {t('app.signOut')}
          </button>
        </div>
      </aside>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} userRole={user?.role} />
      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-border-default shadow-sm sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center justify-between h-header-height px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={22} />
              </button>
              <div className="hidden md:block">
                <h2 className="font-display text-lg font-extrabold text-brand-primary">
                  {'NEXA ' + (user?.role === 'admin' ? 'Admin' : user?.role === 'aggregation' ? 'Warehouse' : 'Operations')}
                </h2>
              </div>
            </div>

            <button
              onClick={() => setCommandOpen(true)}
              className="hidden md:flex relative flex-1 max-w-md mx-6 group"
            >
              <div className="w-full flex items-center gap-2 pl-10 pr-4 py-2 bg-bg-input border border-border-default rounded-full text-sm font-body text-text-tertiary outline-none transition-all group-hover:border-brand-primary/50 group-hover:bg-white cursor-pointer">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <span>{t('app.searchPlaceholder')}</span>
                <span className="ml-auto flex items-center gap-0.5 text-[11px] text-text-tertiary bg-bg-section-alt px-1.5 py-0.5 rounded-md border border-border-default font-mono">
                  <span className="text-xs">⌘</span>K
                </span>
              </div>
            </button>

            <div className="flex items-center gap-1">
              {/* <CurrencySwitch /> */}
              <LanguageSwitch />
              <button
                onClick={() => navigate(ROUTES.SETTINGS_NOTIFICATIONS)}
                className="relative p-2 text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary rounded-full transition-colors"
                title={t('app.notifications')}
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-error rounded-full border border-white" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary rounded-full transition-colors"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => navigate(ROUTES.PROFILE)}
                className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-body text-xs font-bold ml-1 shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                title="Profile"
              >
                {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
              </button>
            </div>
          </div>

          <div className="md:hidden px-4 pb-3">
            <button
              onClick={() => setCommandOpen(true)}
              className="relative w-full"
            >
              <div className="w-full flex items-center gap-2 pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-full text-sm font-body text-text-tertiary outline-none transition-all hover:border-brand-primary/50 hover:bg-white cursor-pointer text-left">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <span>{t('app.searchPlaceholder')}</span>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-6 lg:p-8 max-w-container-max mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
