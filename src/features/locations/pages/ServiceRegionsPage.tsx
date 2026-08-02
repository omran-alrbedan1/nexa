import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useServiceRegionsList, useCreateServiceRegion, useUpdateServiceRegion, useToggleServiceRegionActive, useDeleteServiceRegion } from '../hooks/useServiceRegions';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Layers, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { ServiceRegionForm } from '../components/ServiceRegionForm';
import { useToastStore } from '@/stores/toastStore';

export function ServiceRegionsPage() {
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: number; data: { code: string; name_ar: string; name_en: string | null; name_he: string | null; name_ru: string | null; country_code: string | null; display_order: number; is_active: boolean } } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const { data, isLoading, isError, error, refetch } = useServiceRegionsList({
    search: search || undefined,
    page,
  });

  const createServiceRegion = useCreateServiceRegion();
  const updateServiceRegion = useUpdateServiceRegion();
  const deleteServiceRegion = useDeleteServiceRegion();
  const toggleServiceRegion = useToggleServiceRegionActive();

  const items = data?.data ?? [];
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };
  const total = meta.total;

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteServiceRegion.mutate(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); },
      onError: () => { setDeleteTarget(null); },
    });
  };

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('locations.serviceRegions.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('locations.serviceRegions.description')}</p>
        </div>
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-amber-500/10 via-amber-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Layers size={22} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('locations.serviceRegions.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('locations.serviceRegions.description')}</p>
            </div>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreateModal(true)}>
            {t('locations.serviceRegions.addRegion')}
          </Button>
        </div>
      </div>

      {/* List */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('locations.serviceRegions.list.title')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('locations.serviceRegions.list.count', { count: total })}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('locations.serviceRegions.list.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-sm bg-bg-input border border-border-default rounded-lg outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState title={t('locations.serviceRegions.list.noRegions')} description={search ? t('locations.serviceRegions.list.tryDifferentSearch') : t('locations.serviceRegions.list.addFirstRegion')} />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary font-body">{item.name_ar}</span>
                    {item.name_en && <span className="text-xs text-text-tertiary">({item.name_en})</span>}
                    <span className="text-xs font-mono text-text-tertiary">{item.code}</span>
                    {item.is_active ? (
                      <Badge variant="green" size="sm">{t('common.active')}</Badge>
                    ) : (
                      <Badge variant="red" size="sm">{t('common.inactive')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                    {item.country_code && (
                      <span>{t('locations.serviceRegions.list.countryCode', { code: item.country_code })}</span>
                    )}
                    <span>·</span>
                    <span>{t('locations.serviceRegions.list.order', { order: item.display_order })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => setEditTarget({
                      id: item.id,
                      data: {
                        code: item.code,
                        name_ar: item.name_ar,
                        name_en: item.name_en,
                        name_he: item.name_he,
                        name_ru: item.name_ru,
                        country_code: item.country_code,
                        display_order: item.display_order,
                        is_active: item.is_active,
                      },
                    })}
                    className="p-1.5 rounded-md text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary transition-colors"
                    title={t('common.edit')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: item.id, name: item.name_ar })}
                    className="p-1.5 rounded-md text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                  <Button
                    variant={item.is_active ? 'secondary' : 'primary'}
                    size="sm"
                    isLoading={toggleServiceRegion.isPending}
                    onClick={() => toggleServiceRegion.mutate(item.id)}
                  >
                    {item.is_active ? t('common.deactivate') : t('common.activate')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={meta.currentPage}
          lastPage={meta.lastPage}
          total={meta.total}
          perPage={15}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </Card>

      {/* Create Modal */}
      <ServiceRegionForm
        open={createModal}
        onClose={() => setCreateModal(false)}
        onSave={(data) => createServiceRegion.mutate(data, { onSuccess: () => setCreateModal(false) })}
        isSaving={createServiceRegion.isPending}
      />

      {/* Edit Modal */}
      <ServiceRegionForm
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={(data) => {
          if (editTarget) {
            updateServiceRegion.mutate({ id: editTarget.id, data }, { onSuccess: () => setEditTarget(null) });
          }
        }}
        isSaving={updateServiceRegion.isPending}
        editing={editTarget?.data ?? null}
      />

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('locations.serviceRegions.confirmDeleteTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">
            {t('locations.serviceRegions.confirmDeleteMessage', { name: deleteTarget?.name || '' })}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={deleteServiceRegion.isPending} onClick={handleDelete}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
