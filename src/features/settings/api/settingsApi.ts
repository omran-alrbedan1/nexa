// ============================================================
// Settings & RBAC API Service
// ============================================================
// Covers: RoleController, StaffController, SettingController,
//         BannerController, NotificationController, AuditLogController
// ============================================================

import { apiClient } from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Role Types
// ──────────────────────────────────────────────

export interface Permission {
  id: number;
  name: string;
  displayName: string;
  group: string;
}

export interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
}

interface BackendPermission {
  id: number;
  name: string;
  display_name: string;
  group: string;
}

interface BackendRole {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_system: boolean;
  permissions?: BackendPermission[];
}

function mapRole(r: BackendRole): Role {
  return {
    id: r.id,
    name: r.name,
    displayName: r.display_name,
    description: r.description,
    isSystem: r.is_system,
    permissions: (r.permissions || []).map((p) => ({
      id: p.id,
      name: p.name,
      displayName: p.display_name,
      group: p.group,
    })),
  };
}

// ──────────────────────────────────────────────
// Staff Types
// ──────────────────────────────────────────────

export interface StaffMember {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  status: string;
  lastLoginAt: string | null;
  roles: { id: number; name: string; displayName: string }[];
  permissions: string[];
  createdAt: string;
}

interface BackendStaffMember {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  status: string;
  last_login_at: string | null;
  roles?: { id: number; name: string; display_name: string }[];
  permissions?: string[];
  created_at: string;
}

function mapStaff(s: BackendStaffMember): StaffMember {
  return {
    id: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
    fullName: s.full_name,
    email: s.email,
    status: s.status,
    lastLoginAt: s.last_login_at,
    roles: (s.roles || []).map((r) => ({ id: r.id, name: r.name, displayName: r.display_name })),
    permissions: s.permissions || [],
    createdAt: s.created_at,
  };
}

// ──────────────────────────────────────────────
// Setting Types
// ──────────────────────────────────────────────

export interface Setting {
  id: number;
  group: string;
  key: string;
  value: string;
  type: string;
}

// ──────────────────────────────────────────────
// Banner Types
// ──────────────────────────────────────────────

export interface Banner {
  id: number;
  title: string;
  image: string;
  linkType: string;
  linkId: number | null;
  sortOrder: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  zone?: { id: number; nameAr: string } | null;
  createdAt: string;
}

interface BackendBanner {
  id: number;
  title: string;
  image: string;
  link_type: string;
  link_id: number | null;
  sort_order: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  zone?: { id: number; name_ar: string } | null;
  created_at: string;
}

function mapBanner(b: BackendBanner): Banner {
  return {
    id: b.id,
    title: b.title,
    image: b.image,
    linkType: b.link_type,
    linkId: b.link_id,
    sortOrder: b.sort_order,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    isActive: b.is_active,
    zone: b.zone ? { id: b.zone.id, nameAr: b.zone.name_ar } : null,
    createdAt: b.created_at,
  };
}

// ──────────────────────────────────────────────
// Notification Types
// ──────────────────────────────────────────────

export interface AdminNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: any;
  channel: string;
  readAt: string | null;
  user?: { id: number; fullName: string; phone: string } | null;
  createdAt: string;
}

interface BackendAdminNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: any;
  channel: string;
  read_at: string | null;
  user?: { id: number; full_name: string; phone: string } | null;
  created_at: string;
}

function mapNotification(n: BackendAdminNotification): AdminNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    channel: n.channel,
    readAt: n.read_at,
    user: n.user ? { id: n.user.id, fullName: n.user.full_name, phone: n.user.phone } : null,
    createdAt: n.created_at,
  };
}

// ──────────────────────────────────────────────
// Audit Log Types
// ──────────────────────────────────────────────

export interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  ipAddress: string;
  user?: { id: number; fullName: string } | null;
  createdAt: string;
}

interface BackendAuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string;
  user?: { id: number; full_name: string } | null;
  created_at: string;
}

function mapAuditLog(a: BackendAuditLog): AuditLog {
  return {
    id: a.id,
    action: a.action,
    entityType: a.entity_type,
    entityId: a.entity_id,
    oldValues: a.old_values,
    newValues: a.new_values,
    ipAddress: a.ip_address,
    user: a.user ? { id: a.user.id, fullName: a.user.full_name } : null,
    createdAt: a.created_at,
  };
}

// ──────────────────────────────────────────────
// API Service
// ──────────────────────────────────────────────

export const settingsApi = {
  // ── Roles ──
  getRoles: async (): Promise<Role[]> => {
    try {
      const response = await apiClient.get<ApiResponse<{ roles: BackendRole[] }>>('/api/v1/admin/roles');
      return (response.data.data?.roles || []).map(mapRole);
    } catch {
      throw new Error('Failed to fetch roles');
    }
  },

  getRole: async (id: number): Promise<Role> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendRole>>(`/api/v1/admin/roles/${id}`);
      return mapRole(response.data.data);
    } catch {
      throw new Error('Role not found');
    }
  },

  updateRolePermissions: async (id: number, permissionIds: number[]): Promise<Role> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendRole>>(`/api/v1/admin/roles/${id}/permissions`, {
        permission_ids: permissionIds,
      });
      return mapRole(response.data.data);
    } catch {
      throw new Error('Failed to update permissions');
    }
  },

  // ── Staff ──
  getStaff: async (): Promise<PaginatedResponse<StaffMember>> => {
    try {
      const response = await apiClient.get<ApiResponse<{ staff: BackendStaffMember[]; meta: any }>>('/api/v1/admin/staff');
      const data = response.data.data;
      return {
        data: (data.staff || []).map(mapStaff),
        meta: data.meta || { currentPage: 1, lastPage: 1, perPage: 20, total: 0 },
      };
    } catch {
      throw new Error('Failed to fetch staff');
    }
  },

  getStaffMember: async (id: number): Promise<StaffMember> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendStaffMember>>(`/api/v1/admin/staff/${id}`);
      return mapStaff(response.data.data);
    } catch {
      throw new Error('Staff member not found');
    }
  },

  createStaff: async (data: { firstName: string; lastName: string; email: string; password: string; roleIds: number[] }): Promise<StaffMember> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendStaffMember>>('/api/v1/admin/staff', {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        role_ids: data.roleIds,
      });
      return mapStaff(response.data.data);
    } catch {
      throw new Error('Failed to create staff member');
    }
  },

  updateStaffRoles: async (id: number, roleIds: number[]): Promise<StaffMember> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendStaffMember>>(`/api/v1/admin/staff/${id}/roles`, {
        role_ids: roleIds,
      });
      return mapStaff(response.data.data);
    } catch {
      throw new Error('Failed to update staff roles');
    }
  },

  updateStaffStatus: async (id: number, status: string): Promise<StaffMember> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendStaffMember>>(`/api/v1/admin/staff/${id}/status`, { status });
      return mapStaff(response.data.data);
    } catch {
      throw new Error('Failed to update staff status');
    }
  },

  // ── Settings ──
  getSettings: async (): Promise<Setting[]> => {
    try {
      const response = await apiClient.get<ApiResponse<{ settings: Setting[] }>>('/api/v1/admin/settings');
      return response.data.data?.settings || [];
    } catch {
      throw new Error('Failed to fetch settings');
    }
  },

  updateSetting: async (key: string, value: string): Promise<Setting> => {
    try {
      const response = await apiClient.put<ApiResponse<Setting>>(`/api/v1/admin/settings/${key}`, { value });
      return response.data.data;
    } catch {
      throw new Error('Failed to update setting');
    }
  },

  bulkUpdateSettings: async (settings: { key: string; value: string }[]): Promise<Setting[]> => {
    try {
      const response = await apiClient.put<ApiResponse<Setting[]>>('/api/v1/admin/settings/bulk', { settings });
      return response.data.data || [];
    } catch {
      throw new Error('Failed to bulk update settings');
    }
  },

  // ── Banners ──
  getBanners: async (): Promise<Banner[]> => {
    try {
      const response = await apiClient.get<ApiResponse<{ banners: BackendBanner[] }>>('/api/v1/admin/banners');
      return (response.data.data?.banners || []).map(mapBanner);
    } catch {
      throw new Error('Failed to fetch banners');
    }
  },

  getBanner: async (id: number): Promise<Banner> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendBanner>>(`/api/v1/admin/banners/${id}`);
      return mapBanner(response.data.data);
    } catch {
      throw new Error('Banner not found');
    }
  },

  createBanner: async (data: FormData | Partial<Banner>): Promise<Banner> => {
    try {
      const isFormData = data instanceof FormData;
      const response = await apiClient.post<ApiResponse<BackendBanner>>('/api/v1/admin/banners', data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return mapBanner(response.data.data);
    } catch {
      throw new Error('Failed to create banner');
    }
  },

  updateBanner: async (id: number, data: FormData | Partial<Banner>): Promise<Banner> => {
    try {
      const isFormData = data instanceof FormData;
      const response = await apiClient.post<ApiResponse<BackendBanner>>(`/api/v1/admin/banners/${id}`, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return mapBanner(response.data.data);
    } catch {
      throw new Error('Failed to update banner');
    }
  },

  deleteBanner: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/admin/banners/${id}`);
    } catch {
      throw new Error('Failed to delete banner');
    }
  },

  // ── Notifications ──
  getAdminNotifications: async (): Promise<PaginatedResponse<AdminNotification>> => {
    try {
      const response = await apiClient.get<ApiResponse<{ notifications: BackendAdminNotification[]; meta: any }>>('/api/v1/admin/notifications');
      const data = response.data.data;
      return {
        data: (data.notifications || []).map(mapNotification),
        meta: data.meta || { currentPage: 1, lastPage: 1, perPage: 20, total: 0 },
      };
    } catch {
      throw new Error('Failed to fetch notifications');
    }
  },

  sendNotification: async (data: { userId: number; title: string; body: string; channel?: string }): Promise<AdminNotification> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendAdminNotification>>('/api/v1/admin/notifications/send', data);
      return mapNotification(response.data.data);
    } catch {
      throw new Error('Failed to send notification');
    }
  },

  broadcastNotification: async (data: { title: string; body: string; channel?: string; userType?: string }): Promise<{ sentCount: number }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ sent_count: number }>>('/api/v1/admin/notifications/broadcast', data);
      return { sentCount: response.data.data?.sent_count || 0 };
    } catch {
      throw new Error('Failed to broadcast notification');
    }
  },

  getNotificationStats: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/api/v1/admin/notifications/stats');
      return response.data;
    } catch {
      throw new Error('Failed to fetch notification stats');
    }
  },

  // ── Audit Logs ──
  getAuditLogs: async (page: number = 1): Promise<PaginatedResponse<AuditLog>> => {
    try {
      const response = await apiClient.get<ApiResponse<{ audit_logs: BackendAuditLog[]; meta: any }>>(`/api/v1/admin/audit-logs?page=${page}`);
      const data = response.data.data;
      return {
        data: (data.audit_logs || []).map(mapAuditLog),
        meta: data.meta || { currentPage: 1, lastPage: 1, perPage: 20, total: 0 },
      };
    } catch {
      throw new Error('Failed to fetch audit logs');
    }
  },
};
