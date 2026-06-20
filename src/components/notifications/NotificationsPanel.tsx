import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { unwrap } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/types/common';
import { X, Bell, Info, AlertCircle, CheckCircle, ShoppingCart, Truck, Megaphone, CheckCheck } from 'lucide-react';
import { cn } from '@/utils/cn';

// ── Types ──

interface BackendNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: any;
  channel: string;
  read_at: string | null;
  user: { id: number; full_name: string; phone: string } | null;
  created_at: string;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'order' | 'trip' | 'campaign';
  time: string;
  read: boolean;
}

// ── Mapping ──

function mapBackendNotification(n: BackendNotification): NotificationItem {
  // Map backend type to frontend icon type
  const typeMap: Record<string, NotificationItem['type']> = {
    admin_message: 'info',
    order_update: 'order',
    trip_update: 'trip',
    campaign: 'campaign',
    broadcast: 'info',
    warning: 'warning',
    success: 'success',
  };
  return {
    id: n.id,
    title: n.title,
    message: n.body,
    type: typeMap[n.type] || 'info',
    time: new Date(n.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
    read: n.read_at !== null,
  };
}

// ── API Methods ──

export const notificationApi = {
  /** Fetch notifications from backend */
  getNotifications: async (params?: { read?: boolean; type?: string }): Promise<NotificationItem[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.read !== undefined) queryParams.set('read', String(params.read));
      if (params?.type) queryParams.set('type', params.type);
      const qs = queryParams.toString();
      const response = await apiClient.get<ApiResponse<any>>(`/api/v1/admin/notifications${qs ? '?' + qs : ''}`);
      const data = unwrap(response.data);
      // Backend may return paginated: { data: [...], meta: {...} } or direct array
      const items: BackendNotification[] = Array.isArray(data) ? data : (data.data || []);
      return items.map(mapBackendNotification);
    } catch {
      return [];
    }
  },

  /** Mark a notification as read — backend endpoint doesn't exist yet, uses dummy */
  markRead: async (id: number): Promise<void> => {
    try {
      await apiClient.post(`/api/v1/admin/notifications/${id}/read`).catch(() => {
        throw new Error('Endpoint not available');
      });
    } catch {
      // Dummy fallback — just resolve successfully
      return;
    }
  },

  /** Mark all notifications as read — backend endpoint doesn't exist yet, uses dummy */
  markAllRead: async (): Promise<void> => {
    try {
      await apiClient.post('/api/v1/admin/notifications/read-all').catch(() => {
        throw new Error('Endpoint not available');
      });
    } catch {
      // Dummy fallback — just resolve successfully
      return;
    }
  },
};

// ── Query Keys ──

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
};

// ── Icons & Colors ──

const TYPE_ICONS: Record<NotificationItem['type'], typeof Bell> = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  order: ShoppingCart,
  trip: Truck,
  campaign: Megaphone,
};

const TYPE_COLORS: Record<NotificationItem['type'], string> = {
  info: 'bg-brand-primary-light text-brand-primary',
  warning: 'bg-amber-50 text-amber-600',
  success: 'bg-green-50 text-green-600',
  order: 'bg-brand-accent-light text-brand-accent',
  trip: 'bg-purple-50 text-purple-600',
  campaign: 'bg-brand-accent-light text-brand-accent',
};

// ── Component ──

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationApi.getNotifications({ read: false }),
    refetchInterval: 30_000, // Poll every 30s
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Focus trap / auto-focus
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white border-s border-border-default shadow-lg',
          'transition-transform duration-300 ease-in-out',
          'flex flex-col',
          open ? 'panel-open' : 'panel-closed'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-text-primary" />
            <h2 className="text-base font-bold text-text-primary font-display">{t('notifications.title')}</h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-brand-primary text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors text-xs flex items-center gap-1"
                title={t('notifications.markAllRead')}
              >
                <CheckCheck size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-5 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary-light flex items-center justify-center mb-4">
                <Bell size={28} className="text-brand-primary" />
              </div>
              <h3 className="text-sm font-bold text-text-primary font-display mb-1">{t('notifications.noNotifications')}</h3>
              <p className="text-xs text-text-secondary font-body">
                {t('notifications.allCaughtUp')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-default/50">
              {notifications.map((notification) => {
                const Icon = TYPE_ICONS[notification.type];
                return (
                  <div
                    key={notification.id}
                    onClick={() => { if (!notification.read) markReadMutation.mutate(notification.id); }}
                    className={cn(
                      'px-5 py-4 transition-colors cursor-pointer hover:bg-gray-50',
                      !notification.read && 'bg-brand-primary-light/30 hover:bg-brand-primary-light/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2 rounded-lg flex-shrink-0', TYPE_COLORS[notification.type])}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary font-body">{notification.title}</p>
                        <p className="text-xs text-text-secondary font-body mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-text-tertiary font-body mt-1">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-default text-center">
          <p className="text-xs text-text-tertiary font-body">
            {notifications.length > 0
              ? t('notifications.footerCount', { count: notifications.length })
              : t('notifications.noNew')}
          </p>
        </div>
      </div>
    </>
  );
}
