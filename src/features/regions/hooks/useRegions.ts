import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { regionsApi, type RegionsPageData } from '../api/regionsApi';

export const regionKeys = {
  all: ['regions'] as const,
  pageData: () => [...regionKeys.all, 'page-data'] as const,
  detail: (id: number) => [...regionKeys.all, 'detail', id] as const,
};

export function useRegionsPage(params: { page?: number; search?: string } = {}) {
  return useQuery<RegionsPageData>({
    queryKey: [...regionKeys.pageData(), params],
    queryFn: () => regionsApi.getPageData({ ...params, perPage: params.page ? 15 : undefined }),
    staleTime: 30_000,
  });
}

export function useToggleRegionActive() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => regionsApi.toggleActive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', data.isActive ? t('regions.toast.regionEnabled') : t('regions.toast.regionDisabled'));
    },
    onError: () => addToast('error', t('regions.toast.toggleFailed')),
  });
}

export function useUpdateDeliveryFee() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, deliveryFee }: { id: number; deliveryFee: number }) =>
      regionsApi.updateDeliveryFee(id, deliveryFee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', t('regions.toast.feeUpdated'));
    },
    onError: () => addToast('error', t('regions.toast.feeUpdateFailed')),
  });
}

// ── Zone CRUD ──

export function useCreateZone() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { name_ar: string; name_en?: string; code?: string; boundaries?: { lat: number; lng: number }[][] }) =>
      regionsApi.createZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', t('regions.toast.zoneCreated'));
    },
    onError: () => addToast('error', t('regions.toast.zoneCreateFailed')),
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name_ar?: string; name_en?: string; code?: string; boundaries?: { lat: number; lng: number }[][] } }) =>
      regionsApi.updateZone(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: regionKeys.detail(vars.id) });
      addToast('success', t('regions.toast.zoneUpdated'));
    },
    onError: () => addToast('error', t('regions.toast.zoneUpdateFailed')),
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
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { zone_id: number; name_ar: string; name_en?: string; code?: string }) =>
      regionsApi.createCluster(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...regionKeys.all, 'clusters'] });
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', t('regions.toast.clusterCreated'));
    },
    onError: () => addToast('error', t('regions.toast.clusterCreateFailed')),
  });
}

export function useUpdateCluster() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name_ar?: string; name_en?: string; code?: string; is_active?: boolean } }) =>
      regionsApi.updateCluster(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...regionKeys.all, 'clusters'] });
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', t('regions.toast.clusterUpdated'));
    },
    onError: () => addToast('error', t('regions.toast.clusterUpdateFailed')),
  });
}

export function useDeleteCluster() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => regionsApi.deleteCluster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...regionKeys.all, 'clusters'] });
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', t('regions.toast.clusterDeleted'));
    },
    onError: () => addToast('error', t('regions.toast.clusterDeleteFailed')),
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
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { warehouse_id: number; zone_id: number; trip_date: string; departure_time: string; cutoff_time: string; max_capacity: number; delivery_fee: number }) =>
      regionsApi.createDeliverySlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...regionKeys.all, 'delivery-slots'] });
      addToast('success', t('regions.toast.slotCreated'));
    },
    onError: () => addToast('error', t('regions.toast.slotCreateFailed')),
  });
}

export function useUpdateDeliverySlot() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { max_capacity?: number; delivery_fee?: number; is_available?: boolean } }) =>
      regionsApi.updateDeliverySlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...regionKeys.all, 'delivery-slots'] });
      addToast('success', t('regions.toast.slotUpdated'));
    },
    onError: () => addToast('error', t('regions.toast.slotUpdateFailed')),
  });
}

// ── Working Days ──

export function useUpdateWorkingDays() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, days }: { id: number; days: { day_of_week: number; is_working: boolean }[] }) =>
      regionsApi.updateWorkingDays(id, days),
    onSuccess: () => {
      addToast('success', t('regions.toast.workingDaysUpdated'));
    },
    onError: () => addToast('error', t('regions.toast.workingDaysUpdateFailed')),
  });
}
