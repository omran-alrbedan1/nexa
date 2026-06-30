import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoles, useUpdateRolePermissions } from '../hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Shield, CheckSquare, Square, ChevronRight, ChevronDown, ArrowLeft } from 'lucide-react';
import type { Role, Permission } from '../api/settingsApi';

const PERMISSION_GROUPS: Record<string, string> = {
  admin: 'settings.roles.groups.admin',
  orders: 'settings.roles.groups.orders',
  customers: 'settings.roles.groups.customers',
  suppliers: 'settings.roles.groups.suppliers',
  products: 'settings.roles.groups.products',
  trips: 'settings.roles.groups.trips',
  drivers: 'settings.roles.groups.drivers',
  reports: 'settings.roles.groups.reports',
  settings: 'settings.roles.groups.settings',
};

export function RolesPage() {
  const { t } = useTranslation();
  const { data: roles, isLoading, isError, error, refetch } = useRoles();
  const updatePermissions = useUpdateRolePermissions();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.roles.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('settings.roles.description')}</p>
        </div>
        <ErrorState
          title={t('common.error')}
          message={error instanceof Error ? error.message : t('common.error')}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const openEditor = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissionIds(role.permissions.map((p) => p.id));
    setExpandedGroups({});
  };

  const togglePermission = (permId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const selectGroup = (_group: string, permissions: Permission[]) => {
    const groupIds = permissions.map((p) => p.id);
    const allSelected = groupIds.every((id) => selectedPermissionIds.includes(id));
    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedPermissionIds((prev) => [...new Set([...prev, ...groupIds])]);
    }
  };

  const savePermissions = () => {
    if (selectedRole) {
      updatePermissions.mutate({ id: selectedRole.id, permissionIds: selectedPermissionIds });
      setSelectedRole(null);
    }
  };

  // Group permissions
  const groupedPermissions = selectedRole
    ? selectedRole.permissions.reduce<Record<string, Permission[]>>((acc, p) => {
        const grp = p.group || 'other';
        if (!acc[grp]) acc[grp] = [];
        acc[grp].push(p);
        return acc;
      }, {})
    : {};

  if (selectedRole) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button
          onClick={() => setSelectedRole(null)}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body"
        >
          <ArrowLeft size={16} /> {t('settings.roles.backToRoles')}
        </button>

        <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <Shield size={22} className="text-brand-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-text-primary font-display">{selectedRole.displayName}</h1>
                <p className="text-sm text-text-secondary font-body">{selectedRole.description}</p>
              </div>
            </div>
          </div>
        </div>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text-primary font-display">{t('settings.roles.permissions')}</h3>
            <Button
              variant="primary"
              size="sm"
              isLoading={updatePermissions.isPending}
              onClick={savePermissions}
            >
              {t('common.save')}
            </Button>
          </div>

          <div className="space-y-3">
            {Object.entries(groupedPermissions).map(([group, perms]) => {
              const isExpanded = expandedGroups[group] ?? true;
              const allSelected = perms.every((p) => selectedPermissionIds.includes(p.id));
              const someSelected = perms.some((p) => selectedPermissionIds.includes(p.id));
              const groupKey = PERMISSION_GROUPS[group] || `settings.roles.groups.${group}`;

              return (
                <div key={group} className="rounded-xl border border-border-default/60 overflow-hidden">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-bg-section-alt hover:bg-bg-section transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={16} className="text-text-tertiary" /> : <ChevronRight size={16} className="text-text-tertiary" />}
                      <span className="text-sm font-bold text-text-primary font-body capitalize">{t(groupKey)}</span>
                      <Badge variant={allSelected ? 'green' : someSelected ? 'yellow' : 'red'} size="sm">
                        {perms.filter((p) => selectedPermissionIds.includes(p.id)).length}/{perms.length}
                      </Badge>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); selectGroup(group, perms); }}
                      className="text-xs text-brand-primary hover:underline font-body"
                    >
                      {allSelected ? t('settings.roles.deselectAll') : t('settings.roles.selectAll')}
                    </button>
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-border-default/30">
                      {perms.map((perm) => {
                        const isSelected = selectedPermissionIds.includes(perm.id);
                        return (
                          <button
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-bg-section-alt transition-colors text-left"
                          >
                            {isSelected ? (
                              <CheckSquare size={18} className="text-brand-primary flex-shrink-0" />
                            ) : (
                              <Square size={18} className="text-text-tertiary flex-shrink-0" />
                            )}
                            <div>
                              <span className="text-sm text-text-primary font-body">{perm.displayName}</span>
                              <span className="text-xs text-text-tertiary font-body ml-2">({perm.name})</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Shield size={22} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.roles.title')}</h1>
            <p className="text-sm text-text-secondary font-body">{t('settings.roles.description')}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
      ) : !roles || roles.length === 0 ? (
        <EmptyState title={t('settings.roles.noRoles')} description={t('settings.roles.noRolesDescription')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <Card key={role.id} padding="lg" hover onClick={() => openEditor(role)} className="cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary-light flex items-center justify-center flex-shrink-0">
                  <Shield size={20} className="text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-text-primary font-display">{role.displayName}</h3>
                  <p className="text-xs text-text-secondary font-body mt-0.5">{role.description}</p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {role.isSystem && <Badge variant="purple" size="sm">{t('settings.roles.system')}</Badge>}
                    <Badge variant="teal" size="sm">
                      {t('settings.roles.permissionCount', { count: role.permissions.length })}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
