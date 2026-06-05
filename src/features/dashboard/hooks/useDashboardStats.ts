import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardWidgets } from '../api/dashboardApi';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  widgets: () => [...dashboardKeys.all, 'widgets'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export function useDashboardWidgets() {
  return useQuery<DashboardWidgets>({
    queryKey: dashboardKeys.widgets(),
    queryFn: () => dashboardApi.getWidgets(),
    staleTime: 30_000, // 30 seconds — dashboard refreshes frequently
  });
}
