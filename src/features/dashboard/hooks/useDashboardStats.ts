import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardWidgetsExpanded } from '../api/dashboardApi';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  widgets: () => [...dashboardKeys.all, 'widgets-expanded'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export function useDashboardWidgetsExpanded() {
  return useQuery<DashboardWidgetsExpanded>({
    queryKey: dashboardKeys.widgets(),
    queryFn: () => dashboardApi.getWidgetsExpanded(),
    staleTime: 30_000,
  });
}

export { useDashboardWidgetsExpanded as useDashboardWidgets };
