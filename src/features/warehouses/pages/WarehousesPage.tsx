import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWarehousesList, useDeleteWarehouse } from '../hooks/useWarehouses';
import { useToastStore } from '@/stores/toastStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ROUTES } from '@/routes/routes';
import { Warehouse, Plus, Search, Pencil, Trash2, X } from 'lucide-react';

export function WarehousesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const { data, isLoading } = useWarehousesList(search || undefined, page);
  const deleteWarehouse = useDeleteWarehouse();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteWarehouse.mutate(deleteTarget.id, {
      onSuccess: () => {
        addToast('success', t('warehouses.toast.deleted'));
        setDeleteTarget(null);
      },
      onError: () => {
        addToast('error', t('warehouses.toast.deleteFailed'));
        setDeleteTarget(null);
      },
    });
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Warehouse size={22} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('warehouses.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('warehouses.description')}</p>
            </div>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate(ROUTES.WAREHOUSE_NEW)}>
            {t('warehouses.list.addFirst')}
          </Button>
        </div>
      </div>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('warehouses.list.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-sm bg-bg-input border border-border-default rounded-lg outline-none focus:border-brand-primary"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary">
                <X size={14} />
              </button>
            )}
          </div>
          <span className="text-xs text-text-secondary font-body">{t('warehouses.list.count', { count: data?.total || 0 })}</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
            <Warehouse size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-body">{t('warehouses.list.noWarehouses')}</p>
            <p className="text-xs mt-1">{t('warehouses.list.noWarehousesDescription')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-border-default text-xs text-text-secondary uppercase tracking-wider">
                    <th className="text-left py-3 px-2 font-bold">{t('warehouses.list.code')}</th>
                    <th className="text-left py-3 px-2 font-bold">{t('warehouses.list.nameEn')}</th>
                    <th className="text-left py-3 px-2 font-bold">{t('warehouses.list.nameAr')}</th>
                    <th className="text-left py-3 px-2 font-bold">{t('warehouses.list.zone')}</th>
                    <th className="text-left py-3 px-2 font-bold">{t('warehouses.list.capacity')}</th>
                    <th className="text-left py-3 px-2 font-bold">{t('warehouses.list.status')}</th>
                    <th className="text-right py-3 px-2 font-bold">{t('warehouses.list.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((w) => (
                    <tr key={w.id} className="border-b border-border-default/50 hover:bg-bg-section-alt/50 transition-colors">
                      <td className="py-3 px-2 font-mono text-xs font-bold text-text-primary">{w.code}</td>
                      <td className="py-3 px-2 font-bold text-text-primary">{w.name}</td>
                      <td className="py-3 px-2 text-text-primary" dir="rtl">{w.nameAr || '—'}</td>
                      <td className="py-3 px-2 text-text-secondary">{w.zone?.name || '—'}</td>
                      <td className="py-3 px-2 text-text-secondary">{w.capacity || '—'}</td>
                      <td className="py-3 px-2">
                        <Badge variant={w.isActive ? 'green' : 'red'} size="sm">
                          {w.isActive ? t('warehouses.list.active') : t('warehouses.list.inactive')}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(ROUTES.WAREHOUSE_EDIT.replace(':id', String(w.id)))}
                            className="p-1.5 rounded-md text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary transition-colors"
                            title={t('warehouses.list.edit')}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: w.id, name: w.name })}
                            className="p-1.5 rounded-md text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors"
                            title={t('warehouses.list.delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs rounded-lg border border-border-default hover:bg-bg-section-alt disabled:opacity-30 disabled:cursor-not-allowed font-body">
                  {t('common.previous')}
                </button>
                <span className="text-xs text-text-secondary font-body">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs rounded-lg border border-border-default hover:bg-bg-section-alt disabled:opacity-30 disabled:cursor-not-allowed font-body">
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('warehouses.list.confirmDeleteTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">
            {t('warehouses.list.confirmDeleteMessage', { name: deleteTarget?.name || '' })}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={deleteWarehouse.isPending} onClick={handleDelete}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
