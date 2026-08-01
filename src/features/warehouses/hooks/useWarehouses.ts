import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesApi } from '../api/warehousesApi';
import type { WarehouseFormData } from '../api/warehousesApi';

const warehouseKeys = {
  all: ['warehouses'] as const,
  list: (params?: Record<string, unknown>) => ['warehouses', 'list', params] as const,
  detail: (id: number) => ['warehouses', id] as const,
};

export function useWarehousesList(search?: string, page?: number) {
  return useQuery({
    queryKey: warehouseKeys.list({ search, page }),
    queryFn: () => warehousesApi.getAll({ search, page, perPage: 15 }),
    staleTime: 30_000,
  });
}

export function useWarehouse(id: number) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => warehousesApi.getById(id),
    enabled: id > 0,
    staleTime: 30_000,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WarehouseFormData) => warehousesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WarehouseFormData> }) => warehousesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => warehousesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
  });
}
