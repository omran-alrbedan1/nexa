import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardWidgetsExpanded } from '../api/dashboardApi';
import type { DashboardFilterState } from '../components/DashboardFilterBar';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  widgets: (filters?: DashboardFilterState) => [...dashboardKeys.all, 'widgets-expanded', filters] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export function useDashboardWidgetsExpanded(filters?: DashboardFilterState) {
  return useQuery<DashboardWidgetsExpanded>({
    queryKey: dashboardKeys.widgets(filters),
    queryFn: () => dashboardApi.getWidgetsExpanded(filters),
    staleTime: 30_000,
  });
}

export { useDashboardWidgetsExpanded as useDashboardWidgets };
