import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStaff, useCreateStaff, useUpdateStaffRoles, useUpdateStaffStatus, useRoles } from '../hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Users, UserPlus, Shield, Mail, Clock } from 'lucide-react';
import type { StaffMember } from '../api/settingsApi';

export function StaffPage() {
  const { t } = useTranslation();
  const { data: staffData, isLoading, isError, error, refetch } = useStaff();
  const { data: roles } = useRoles();
  const createStaff = useCreateStaff();
  const updateRoles = useUpdateStaffRoles();
  const updateStatus = useUpdateStaffStatus();

  const [createModal, setCreateModal] = useState(false);
  const [roleModal, setRoleModal] = useState<{ open: boolean; member: StaffMember | null; selectedRoleIds: number[] }>({
    open: false, member: null, selectedRoleIds: [],
  });

  // Create form state
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', roleIds: [] as number[] });

  const staff = staffData?.data || [];

  const openRoleModal = (member: StaffMember) => {
    setRoleModal({
      open: true,
      member,
      selectedRoleIds: member.roles.map((r) => r.id),
    });
  };

  const saveRoles = () => {
    if (roleModal.member) {
      updateRoles.mutate({ id: roleModal.member.id, roleIds: roleModal.selectedRoleIds });
      setRoleModal({ ...roleModal, open: false });
    }
  };

  const toggleRoleInModal = (roleId: number) => {
    setRoleModal((prev) => ({
      ...prev,
      selectedRoleIds: prev.selectedRoleIds.includes(roleId)
        ? prev.selectedRoleIds.filter((id) => id !== roleId)
        : [...prev.selectedRoleIds, roleId],
    }));
  };

  const handleCreate = () => {
    createStaff.mutate(form, {
      onSuccess: () => {
        setCreateModal(false);
        setForm({ firstName: '', lastName: '', email: '', password: '', roleIds: [] });
      },
    });
  };

  const handleToggleStatus = (member: StaffMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    updateStatus.mutate({ id: member.id, status: newStatus });
  };

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.staff.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('settings.staff.description')}</p>
        </div>
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <Users size={22} className="text-brand-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.staff.title')}</h1>
                <p className="text-sm text-text-secondary font-body">{t('settings.staff.description')}</p>
              </div>
            </div>
            <Button variant="primary" size="sm" leftIcon={<UserPlus size={14} />} onClick={() => setCreateModal(true)}>
              {t('settings.staff.addStaff')}
            </Button>
          </div>
        </div>
      </div>

      <Card padding="lg">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
          </div>
        ) : staff.length === 0 ? (
          <EmptyState title={t('settings.staff.noStaff')} description={t('settings.staff.addFirst')} />
        ) : (
          <div className="space-y-3">
            {staff.map((member) => (
              <div key={member.id} className="p-4 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-brand-primary-light flex items-center justify-center flex-shrink-0">
                        <Users size={16} className="text-brand-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-text-primary font-body">{member.fullName}</span>
                          <Badge variant={member.status === 'active' ? 'green' : 'red'} size="sm">
                            {member.status === 'active' ? t('common.active') : t('common.inactive')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="ml-11 mt-2">
                      <div className="flex items-center gap-4 text-xs text-text-secondary font-body flex-wrap">
                        <span className="flex items-center gap-1"><Mail size={12} /> {member.email}</span>
                        {member.lastLoginAt && (
                          <span className="flex items-center gap-1"><Clock size={12} /> {new Date(member.lastLoginAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {member.roles.map((role) => (
                          <Badge key={role.id} variant="teal" size="sm">{role.displayName}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                   <div className="flex items-center gap-2 ml-2 sm:ml-4 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openRoleModal(member)}>
                      <Shield size={14} className="mr-1" /> {t('settings.staff.roles')}
                    </Button>
                    <Button
                      variant={member.status === 'active' ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleStatus(member)}
                    >
                      {member.status === 'active' ? t('settings.staff.deactivate') : t('settings.staff.activate')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Staff Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title={t('settings.staff.createTitle')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.staff.firstName')}</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.staff.lastName')}</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.staff.email')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.staff.password')}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.staff.roles')}</label>
            <div className="space-y-1.5">
              {(roles || []).map((role) => (
                <label key={role.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.roleIds.includes(role.id)}
                    onChange={() => setForm((prev) => ({
                      ...prev,
                      roleIds: prev.roleIds.includes(role.id)
                        ? prev.roleIds.filter((id) => id !== role.id)
                        : [...prev.roleIds, role.id],
                    }))}
                    className="rounded border-border-default"
                  />
                  <span className="text-sm text-text-primary font-body">{role.displayName}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setCreateModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={createStaff.isPending} onClick={handleCreate}>{t('settings.staff.create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Role Assignment Modal */}
      <Modal open={roleModal.open} onClose={() => setRoleModal({ ...roleModal, open: false })} title={t('settings.staff.assignRoles')}>
        <div className="space-y-3">
          <p className="text-sm text-text-secondary font-body">{t('settings.staff.assignRolesDescription', { name: roleModal.member?.fullName })}</p>
          <div className="space-y-1.5">
            {(roles || []).map((role) => (
              <label key={role.id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={roleModal.selectedRoleIds.includes(role.id)}
                  onChange={() => toggleRoleInModal(role.id)}
                  className="rounded border-border-default"
                />
                <span className="text-sm text-text-primary font-body">{role.displayName}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setRoleModal({ ...roleModal, open: false })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={updateRoles.isPending} onClick={saveRoles}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
