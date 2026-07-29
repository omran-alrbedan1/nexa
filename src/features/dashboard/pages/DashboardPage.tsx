import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardWidgetsExpanded } from '../hooks/useDashboardStats';
import { AdminDashboard } from '../components/AdminDashboard';
import { OperationsDashboard } from '../components/OperationsDashboard';
import { WarehouseDashboard } from '../components/WarehouseDashboard';
import { ErrorState } from '@/components/ui/ErrorState';
import { TrendingUp, CalendarDays } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { getDefaultFilters, type DashboardFilterState } from '../components/DashboardFilterBar';

const ROLE_GRADIENTS: Record<string, string> = {
  admin: 'from-brand-primary/10 via-brand-primary-light to-transparent',
  operations: 'from-brand-accent/10 via-brand-accent-light to-transparent',
  aggregation: 'from-purple-500/10 via-purple-50 to-transparent',
};

const ROLE_TITLE_KEYS: Record<string, string> = {
  admin: 'dashboard.adminTitle',
  operations: 'dashboard.operationsTitle',
  aggregation: 'dashboard.warehouseTitle',
};

const ROLE_DESC_KEYS: Record<string, string> = {
  admin: 'dashboard.adminDescription',
  operations: 'dashboard.operationsDescription',
  aggregation: 'dashboard.warehouseDescription',
};

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.greetingMorning';
  if (hour < 17) return 'dashboard.greetingAfternoon';
  return 'dashboard.greetingEvening';
}

export function DashboardPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState<DashboardFilterState>(getDefaultFilters);
  const formatPrice = useFormatPrice();

  // Merge partial filter updates into full state (no data loss)
  const handleFilterChange = useCallback((partial: Partial<DashboardFilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const { data, isLoading, error, refetch } = useDashboardWidgetsExpanded(filters);

  const role = user?.role ?? 'admin';
  const gradient = ROLE_GRADIENTS[role] || ROLE_GRADIENTS.admin;
  const titleKey = ROLE_TITLE_KEYS[role] || 'dashboard.adminTitle';
  const descKey = ROLE_DESC_KEYS[role] || 'dashboard.adminDescription';

  if (error) {
    return (
      <ErrorState
        title={t('common.error')}
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Hero Header ── */}
      <div className={cn('relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br', gradient)}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-1.5 bg-white/30 backdrop-blur-sm rounded-full px-3 py-1">
                <CalendarDays size={12} className="text-brand-primary-dark" />
                <span className="text-xs font-bold text-brand-primary-dark font-body">{new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'he' ? 'he-IL' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/30 backdrop-blur-sm rounded-full px-3 py-1">
                <TrendingUp size={12} className="text-brand-primary-dark" />
                <span className="text-xs font-bold text-brand-primary-dark font-body">{t('dashboard.live')}</span>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display mt-2">
              {t(getGreetingKey())}, {user?.full_name?.split(' ')[0] || t('common.user')}
            </h1>
            <p className="text-sm text-text-secondary font-body mt-1 max-w-xl">
              {t(descKey)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xs">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-body">{t('dashboard.todayRevenue')}</p>
              <p className="text-lg font-extrabold text-brand-primary font-display">
                {formatPrice(data?.stats.revenueToday ?? 0)}
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 hidden sm:block shadow-xs">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-body">{t('dashboard.thisMonth')}</p>
              <p className="text-lg font-extrabold text-brand-accent font-display">
                {formatPrice(data?.stats.revenueThisMonth ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Role-specific dashboard */}
      {role === 'admin' && (
        <AdminDashboard
          data={data}
          isLoading={isLoading}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={() => { setFilters(getDefaultFilters()); }}
        />
      )}
      {role === 'operations' && (
        <OperationsDashboard
          data={data}
          isLoading={isLoading}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={() => { setFilters(getDefaultFilters()); }}
        />
      )}
      {role === 'aggregation' && (
        <WarehouseDashboard
          data={data}
          isLoading={isLoading}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={() => { setFilters(getDefaultFilters()); }}
        />
      )}

      {!['admin', 'operations', 'aggregation'].includes(role) && (
        <AdminDashboard
          data={data}
          isLoading={isLoading}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={() => { setFilters(getDefaultFilters()); }}
        />
      )}
    </div>
  );
}
