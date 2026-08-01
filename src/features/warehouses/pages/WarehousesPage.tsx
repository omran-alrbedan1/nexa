import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWarehousesList, useDeleteWarehouse } from '../hooks/useWarehouses';
import { useToastStore } from '@/stores/toastStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ListItem } from '@/components/ui/ListItem';
import { Pagination } from '@/components/ui/Pagination';
import { ROUTES } from '@/routes/routes';
import { Warehouse, Plus, Search, Pencil, Trash2, X, CheckCircle2, Building2, Package } from 'lucide-react';

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

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

  const warehouses = data?.data ?? [];
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };
  const total = meta.total;
  const activeWarehouses = warehouses.filter((w) => w.isActive).length;
  const totalCapacity = warehouses.reduce((sum, w) => sum + (w.capacity || 0), 0);

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {[
          { key: 'total', label: t('warehouses.stats.total'), icon: Building2, variant: 'teal' as const },
          { key: 'active', label: t('warehouses.stats.active'), icon: CheckCircle2, variant: 'success' as const },
          { key: 'capacity', label: t('warehouses.stats.capacity'), icon: Package, variant: 'purple' as const },
        ].map((s) => {
          const Icon = s.icon;
          const val = s.key === 'total' ? total : s.key === 'active' ? activeWarehouses : totalCapacity;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : val ?? '—'}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                  s.variant === 'success' ? 'bg-green-50 text-green-600' :
                  'bg-purple-50 text-purple-600'
                )}>
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('warehouses.list.title')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('warehouses.list.count', { count: total })}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-4">
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
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
          </div>
        ) : warehouses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
            <Warehouse size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-body">{t('warehouses.list.noWarehouses')}</p>
            <p className="text-xs mt-1">{t('warehouses.list.noWarehousesDescription')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warehouses.map((w) => (
              <ListItem
                key={w.id}
                onClick={() => navigate(ROUTES.WAREHOUSE_EDIT.replace(':id', String(w.id)))}
                icon={<Warehouse size={16} className="text-purple-600" />}
                title={<span className="text-sm font-bold text-text-primary font-body truncate">{w.name}</span>}
                badges={<>
                  <span className="text-xs text-text-tertiary font-mono">{w.code}</span>
                  {w.isActive ? <Badge variant="green" size="sm">{t('warehouses.list.active')}</Badge> : <Badge variant="red" size="sm">{t('warehouses.list.inactive')}</Badge>}
                </>}
                actions={<>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(ROUTES.WAREHOUSE_EDIT.replace(':id', String(w.id))); }}
                    className="p-1.5 rounded-md text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary transition-colors"
                    title={t('warehouses.list.edit')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: w.id, name: w.name }); }}
                    className="p-1.5 rounded-md text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors"
                    title={t('warehouses.list.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </>}
              >
                <div className="flex items-center gap-4 text-xs text-text-secondary font-body flex-wrap">
                  <span dir="rtl">{w.nameAr || '—'}</span>
                  <span>·</span>
                  <span>{w.zone?.name || t('warehouses.list.noZone')}</span>
                  {w.capacity && <><span>·</span><span>{t('warehouses.list.capacity')}: {w.capacity}</span></>}
                </div>
              </ListItem>
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
