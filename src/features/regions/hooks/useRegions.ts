import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { regionsApi, type RegionsPageData } from '../api/regionsApi';

export const regionKeys = {
  all: ['regions'] as const,
  pageData: () => [...regionKeys.all, 'page-data'] as const,
  detail: (id: number) => [...regionKeys.all, 'detail', id] as const,
};

export function useRegionsPage() {
  return useQuery<RegionsPageData>({
    queryKey: regionKeys.pageData(),
    queryFn: () => regionsApi.getPageData(),
    staleTime: 30_000,
  });
}

export function useToggleRegionActive() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => regionsApi.toggleActive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', data.isActive ? 'Region enabled' : 'Region disabled');
    },
    onError: () => addToast('error', 'Failed to toggle region'),
  });
}

export function useUpdateDeliveryFee() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, deliveryFee }: { id: number; deliveryFee: number }) =>
      regionsApi.updateDeliveryFee(id, deliveryFee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', 'Delivery fee updated');
    },
    onError: () => addToast('error', 'Failed to update delivery fee'),
  });
}

// ── Zone CRUD ──

export function useCreateZone() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { name_ar: string; name_en?: string; code?: string }) =>
      regionsApi.createZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', 'Zone created');
    },
    onError: () => addToast('error', 'Failed to create zone'),
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name_ar?: string; name_en?: string; code?: string } }) =>
      regionsApi.updateZone(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: regionKeys.detail(vars.id) });
      addToast('success', 'Zone updated');
    },
    onError: () => addToast('error', 'Failed to update zone'),
  });
}

// ── Cluster CRUD ──

export function useClusters() {
  return useQuery({
    queryKey: [...regionKeys.all, 'clusters'],
    queryFn: () => regionsApi.getClusters(),
    staleTime: 30_000,
  });
}

export function useCreateCluster() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { zone_id: number; name_ar: string; name_en?: string; code?: string }) =>
      regionsApi.createCluster(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...regionKeys.all, 'clusters'] });
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', 'Cluster created');
    },
    onError: () => addToast('error', 'Failed to create cluster'),
  });
}

export function useUpdateCluster() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name_ar?: string; name_en?: string; code?: string; is_active?: boolean } }) =>
      regionsApi.updateCluster(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...regionKeys.all, 'clusters'] });
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', 'Cluster updated');
    },
    onError: () => addToast('error', 'Failed to update cluster'),
  });
}

export function useDeleteCluster() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => regionsApi.deleteCluster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...regionKeys.all, 'clusters'] });
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', 'Cluster deleted');
    },
    onError: () => addToast('error', 'Failed to delete cluster'),
  });
}

// ── Delivery Slots ──

export function useDeliverySlots(zoneId?: number) {
  return useQuery({
    queryKey: [...regionKeys.all, 'delivery-slots', zoneId],
    queryFn: () => regionsApi.getDeliverySlots(zoneId),
    staleTime: 30_000,
  });
}

export function useDeliverySlotsForZone(zoneId: number) {
  return useQuery({
    queryKey: [...regionKeys.all, 'delivery-slots', 'zone', zoneId],
    queryFn: () => regionsApi.getDeliverySlots(zoneId),
    staleTime: 30_000,
    enabled: zoneId > 0,
  });
}

export function useCreateDeliverySlot() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { warehouse_id: number; zone_id: number; trip_date: string; departure_time: string; cutoff_time: string; max_capacity: number; delivery_fee: number }) =>
      regionsApi.createDeliverySlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...regionKeys.all, 'delivery-slots'] });
      addToast('success', 'Delivery slot created');
    },
    onError: () => addToast('error', 'Failed to create delivery slot'),
  });
}

export function useUpdateDeliverySlot() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { max_capacity?: number; delivery_fee?: number; is_available?: boolean } }) =>
      regionsApi.updateDeliverySlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...regionKeys.all, 'delivery-slots'] });
      addToast('success', 'Delivery slot updated');
    },
    onError: () => addToast('error', 'Failed to update delivery slot'),
  });
}

// ── Working Days ──

export function useUpdateWorkingDays() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, days }: { id: number; days: { day_of_week: number; is_working: boolean }[] }) =>
      regionsApi.updateWorkingDays(id, days),
    onSuccess: () => {
      addToast('success', 'Working days updated');
    },
    onError: () => addToast('error', 'Failed to update working days'),
  });
}
