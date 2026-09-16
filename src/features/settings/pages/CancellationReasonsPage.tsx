import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCancellationReasons, useCreateCancellationReason, useUpdateCancellationReason, useDeleteCancellationReason } from '../hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListItem } from '@/components/ui/ListItem';
import { Ban, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import type { CancellationReason } from '../api/settingsApi';

export function CancellationReasonsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useCancellationReasons();
  const createReason = useCreateCancellationReason();
  const updateReason = useUpdateCancellationReason();
  const deleteReason = useDeleteCancellationReason();

  const [modal, setModal] = useState<{ open: boolean; editing: CancellationReason | null }>({ open: false, editing: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; reason: CancellationReason | null }>({ open: false, reason: null });
  const [form, setForm] = useState<{ code: string; nameAr: string; nameEn: string; sortOrder: number; isActive: boolean }>(
    { code: '', nameAr: '', nameEn: '', sortOrder: 1, isActive: true }
  );

  const openCreate = () => {
    setForm({ code: '', nameAr: '', nameEn: '', sortOrder: (data?.length ?? 0) + 1, isActive: true });
    setModal({ open: true, editing: null });
  };

  const openEdit = (reason: CancellationReason) => {
    setForm({ code: reason.code, nameAr: reason.nameAr, nameEn: reason.nameEn ?? '', sortOrder: reason.sortOrder, isActive: reason.isActive });
    setModal({ open: true, editing: reason });
  };

  const handleSave = () => {
    if (modal.editing) {
      updateReason.mutate({ id: modal.editing.id, data: form });
    } else {
      createReason.mutate(form);
    }
    setModal({ open: false, editing: null });
  };

  const handleDelete = () => {
    if (deleteModal.reason) {
      deleteReason.mutate(deleteModal.reason.id);
      setDeleteModal({ open: false, reason: null });
    }
  };

  const toggleActive = (reason: CancellationReason) => {
    updateReason.mutate({ id: reason.id, data: { isActive: !reason.isActive } });
  };

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.cancellationReasons.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('settings.cancellationReasons.description')}</p>
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
                <Ban size={22} className="text-brand-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.cancellationReasons.title')}</h1>
                <p className="text-sm text-text-secondary font-body">{t('settings.cancellationReasons.description')}</p>
              </div>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
              {t('settings.cancellationReasons.add')}
            </Button>
          </div>
        </div>
      </div>

      <Card padding="lg">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState title={t('settings.cancellationReasons.noReasons')} description={t('settings.cancellationReasons.addFirst')} />
        ) : (
          <div className="space-y-3">
            {data.map((reason) => (
              <ListItem
                key={reason.id}
                icon={<Ban size={16} className="text-brand-primary" />}
                title={<span className="text-sm font-bold text-text-primary font-body truncate">{reason.nameAr}</span>}
                badges={<Badge variant={reason.isActive ? 'green' : 'red'} size="sm">{reason.isActive ? t('common.active') : t('common.inactive')}</Badge>}
                actions={<>
                  <button onClick={() => toggleActive(reason)} className="p-1.5 text-text-secondary hover:text-brand-primary rounded-lg hover:bg-bg-section-alt transition-all" title={reason.isActive ? t('common.deactivate') : t('common.activate')}>
                    {reason.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => openEdit(reason)} className="p-1.5 text-text-secondary hover:text-brand-primary rounded-lg hover:bg-bg-section-alt transition-all">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setDeleteModal({ open: true, reason })} className="p-1.5 text-text-secondary hover:text-status-error rounded-lg hover:bg-brand-accent-light transition-all">
                    <Trash2 size={16} />
                  </button>
                </>}
              >
                <div className="flex items-center gap-3 text-xs text-text-tertiary font-body flex-wrap">
                  <span>{reason.code}</span>
                  {reason.nameEn && <span>{reason.nameEn}</span>}
                  <span>{t('settings.cancellationReasons.order')}: {reason.sortOrder}</span>
                </div>
              </ListItem>
            ))}
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal open={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.editing ? t('settings.cancellationReasons.edit') : t('settings.cancellationReasons.create')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.cancellationReasons.code')}</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" placeholder="out_of_stock" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.cancellationReasons.nameAr')}</label>
              <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.cancellationReasons.nameEn')}</label>
              <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.cancellationReasons.sortOrder')}</label>
            <input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-border-default" />
            <span className="text-sm text-text-primary font-body">{t('common.active')}</span>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModal({ ...modal, open: false })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={createReason.isPending || updateReason.isPending} onClick={handleSave}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, reason: null })} title={t('settings.cancellationReasons.deleteTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">{t('settings.cancellationReasons.deleteDescription', { name: deleteModal.reason?.nameAr })}</p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteModal({ open: false, reason: null })}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={deleteReason.isPending} onClick={handleDelete}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
