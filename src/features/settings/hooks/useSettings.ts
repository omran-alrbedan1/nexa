import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { settingsApi, type Role, type Setting, type Banner } from '../api/settingsApi';

// ── Query Keys ──

export const settingsKeys = {
  all: ['settings'] as const,
  roles: () => [...settingsKeys.all, 'roles'] as const,
  role: (id: number) => [...settingsKeys.all, 'roles', id] as const,
  staff: () => [...settingsKeys.all, 'staff'] as const,
  staffMember: (id: number) => [...settingsKeys.all, 'staff', id] as const,
  settingsList: () => [...settingsKeys.all, 'list'] as const,
  banners: () => [...settingsKeys.all, 'banners'] as const,
  banner: (id: number) => [...settingsKeys.all, 'banners', id] as const,
  notifications: () => [...settingsKeys.all, 'notifications'] as const,
  notificationStats: () => [...settingsKeys.all, 'notifications', 'stats'] as const,
  auditLogs: () => [...settingsKeys.all, 'audit-logs'] as const,
};

// ── Roles ──

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: settingsKeys.roles(),
    queryFn: () => settingsApi.getRoles(),
    staleTime: 60_000,
  });
}

export function useRole(id: number) {
  return useQuery<Role>({
    queryKey: settingsKeys.role(id),
    queryFn: () => settingsApi.getRole(id),
    enabled: id > 0,
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, permissionIds }: { id: number; permissionIds: number[] }) =>
      settingsApi.updateRolePermissions(id, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.roles() });
      addToast('success', t('settings.toast.permissionsUpdated'));
    },
    onError: () => addToast('error', t('settings.toast.permissionsUpdateFailed')),
  });
}

// ── Staff ──

export function useStaff() {
  return useQuery({
    queryKey: settingsKeys.staff(),
    queryFn: () => settingsApi.getStaff(),
    staleTime: 30_000,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { firstName: string; lastName: string; email: string; password: string; roleIds: number[] }) =>
      settingsApi.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.staff() });
      addToast('success', t('settings.toast.staffCreated'));
    },
    onError: () => addToast('error', t('settings.toast.staffCreateFailed')),
  });
}

export function useUpdateStaffRoles() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, roleIds }: { id: number; roleIds: number[] }) =>
      settingsApi.updateStaffRoles(id, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.staff() });
      addToast('success', t('settings.toast.staffRolesUpdated'));
    },
    onError: () => addToast('error', t('settings.toast.staffRolesUpdateFailed')),
  });
}

export function useUpdateStaffStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      settingsApi.updateStaffStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.staff() });
      addToast('success', t('settings.toast.staffStatusUpdated'));
    },
    onError: () => addToast('error', t('settings.toast.staffStatusUpdateFailed')),
  });
}

// ── Settings ──

export function useSettings() {
  return useQuery<Setting[]>({
    queryKey: settingsKeys.settingsList(),
    queryFn: () => settingsApi.getSettings(),
    staleTime: 60_000,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      settingsApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.settingsList() });
      addToast('success', t('settings.toast.settingUpdated'));
    },
    onError: () => addToast('error', t('settings.toast.settingUpdateFailed')),
  });
}

export function useBulkUpdateSettings() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (settings: { key: string; value: string }[]) =>
      settingsApi.bulkUpdateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.settingsList() });
      addToast('success', t('settings.toast.settingsUpdated'));
    },
    onError: () => addToast('error', t('settings.toast.settingsUpdateFailed')),
  });
}

// ── Banners ──

export function useBanners() {
  return useQuery<Banner[]>({
    queryKey: settingsKeys.banners(),
    queryFn: () => settingsApi.getBanners(),
    staleTime: 30_000,
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: FormData) => settingsApi.createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.banners() });
      addToast('success', 'Banner created');
    },
    onError: () => addToast('error', 'Failed to create banner'),
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData | Partial<Banner> }) =>
      settingsApi.updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.banners() });
      addToast('success', 'Banner updated');
    },
    onError: () => addToast('error', 'Failed to update banner'),
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => settingsApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.banners() });
      addToast('success', 'Banner deleted');
    },
    onError: () => addToast('error', 'Failed to delete banner'),
  });
}

// ── Notifications ──

export function useAdminNotifications() {
  return useQuery({
    queryKey: settingsKeys.notifications(),
    queryFn: () => settingsApi.getAdminNotifications(),
    staleTime: 30_000,
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { userId: number; title: string; body: string; channel?: string }) =>
      settingsApi.sendNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.notifications() });
      addToast('success', 'Notification sent');
    },
    onError: () => addToast('error', 'Failed to send notification'),
  });
}

export function useBroadcastNotification() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { title: string; body: string; channel?: string; userType?: string }) =>
      settingsApi.broadcastNotification(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.notifications() });
      addToast('success', `Notification broadcast to ${result.sentCount} users`);
    },
    onError: () => addToast('error', 'Failed to broadcast notification'),
  });
}

// ── Audit Logs ──

export function useAuditLogs(page: number = 1) {
  return useQuery({
    queryKey: [...settingsKeys.auditLogs(), page],
    queryFn: () => settingsApi.getAuditLogs(page),
    staleTime: 60_000,
  });
}
