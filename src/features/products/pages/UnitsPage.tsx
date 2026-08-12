import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitsApi, type ProductUnit, type UnitInput } from '../api/unitsApi';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListItem } from '@/components/ui/ListItem';
import { Pagination } from '@/components/ui/Pagination';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';
import { useToastStore } from '@/stores/toastStore';
import { Ruler, Plus, Pencil, Trash2, CheckCircle2, XCircle, Hash } from 'lucide-react';

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

const EMPTY_FORM = {
  code: '',
  names: {} as Partial<Record<TranslatedLang, string>>,
  sortOrder: '0',
  isActive: true,
};

export function UnitsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; unit?: ProductUnit }>({ open: false });
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; unit: ProductUnit | null }>({ open: false, unit: null });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['product-units', page, search],
    queryFn: () => unitsApi.list({ page, search }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['product-units'] });

  const saveMutation = useMutation({
    mutationFn: (input: UnitInput & { id?: number }) => {
      if (input.id) {
        const { id, ...rest } = input;
        return unitsApi.update(id, rest);
      }
      return unitsApi.create(input);
    },
    onSuccess: () => {
      invalidate();
      addToast('success', modal.unit ? t('units.toast.updated') : t('units.toast.created'));
      setModal({ open: false });
    },
    onError: (err: any) => {
      addToast('error', err?.response?.data?.message || t('units.toast.saveFailed'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => unitsApi.toggle(id),
    onSuccess: () => {
      invalidate();
      addToast('success', t('units.toast.toggled'));
    },
    onError: (err: any) => {
      addToast('error', err?.response?.data?.message || t('units.toast.toggleFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => unitsApi.delete(id),
    onSuccess: () => {
      invalidate();
      addToast('success', t('units.toast.deleted'));
      setDeleteModal({ open: false, unit: null });
    },
    onError: (err: any) => {
      addToast('error', err?.response?.data?.message || t('units.toast.deleteFailed'));
    },
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true });
  };

  const openEdit = (unit: ProductUnit) => {
    setForm({
      code: unit.code,
      names: { ar: unit.nameAr, en: unit.nameEn ?? '', he: unit.nameHe ?? '', ru: unit.nameRu ?? '' },
      sortOrder: String(unit.sortOrder ?? 0),
      isActive: unit.isActive,
    });
    setModal({ open: true, unit });
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.names.ar?.trim()) {
      addToast('error', t('units.validation.required'));
      return;
    }
    saveMutation.mutate({
      id: modal.unit?.id,
      code: form.code.trim(),
      name_ar: form.names.ar ?? '',
      name_en: form.names.en || null,
      name_he: form.names.he || null,
      name_ru: form.names.ru || null,
      sort_order: parseInt(form.sortOrder, 10) || 0,
      is_active: form.isActive,
    });
  };

  const units = data?.units ?? [];
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, total: 0 };
  const activeCount = units.filter((u) => u.isActive).length;
  const inactiveCount = units.length - activeCount;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-teal-500/10 via-teal-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Ruler size={22} className="text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('units.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('units.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-teal-500 via-brand-primary to-teal-500 rounded-full opacity-30" />
      </div>

      {isError ? (
        <ErrorState title={t('units.errorTitle')} message={error instanceof Error ? error.message : t('units.errorMessage')} onRetry={() => refetch()} />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5">
            {[
              { key: 'total', label: t('units.stats.total'), icon: Ruler, variant: 'teal' as const },
              { key: 'active', label: t('units.stats.active'), icon: CheckCircle2, variant: 'success' as const },
              { key: 'inactive', label: t('units.stats.inactive'), icon: XCircle, variant: 'coral' as const },
            ].map((s) => {
              const Icon = s.icon;
              const value = s.key === 'total' ? meta.total : s.key === 'active' ? activeCount : inactiveCount;
              return (
                <Card key={s.key} padding="md" hover>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                      <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                        {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : value}
                      </p>
                    </div>
                    <div className={cn(
                      'p-2.5 rounded-lg flex-shrink-0',
                      s.variant === 'teal' ? 'bg-teal-50 text-teal-600' :
                      s.variant === 'success' ? 'bg-green-50 text-green-600' :
                      'bg-brand-accent-light text-brand-accent'
                    )}>
                      <Icon size={18} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* List */}
          <Card padding="lg">
            <CardHeader
              action={
                <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
                  {t('units.list.addUnit')}
                </Button>
              }
            >
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display">{t('units.list.allUnits')}</h3>
                <p className="text-xs text-text-secondary font-body mt-0.5">{meta.total} {t('common.items')}</p>
              </div>
            </CardHeader>

            <div className="mb-4">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={t('units.list.searchPlaceholder')}
                className="w-full max-w-sm px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              />
            </div>

            {isLoading ? (
              <div className="space-y-3 animate-pulse">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
            ) : units.length === 0 ? (
              <EmptyState title={t('units.list.noUnits')} description={t('units.list.noUnitsDescription')} action={
                <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
                  {t('units.list.addUnit')}
                </Button>
              } />
            ) : (
              <div className="space-y-2">
                {units.map((unit) => (
                  <div key={unit.id} className="rounded-xl border border-border-default/60 hover:border-border-default transition-colors">
                    <ListItem
                      icon={<Ruler size={16} className="text-teal-600" />}
                      iconClassName="bg-teal-50"
                      title={<span className="text-sm font-bold text-text-primary font-body truncate">{unit.nameAr}</span>}
                      badges={<>
                        {unit.nameEn && (
                          <span className="text-xs text-text-tertiary truncate hidden sm:inline">{unit.nameEn}</span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                          <Hash size={10} />
                          {unit.code}
                        </span>
                        <Badge variant={unit.isActive ? 'green' : 'red'} size="sm">
                          {unit.isActive ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </>}
                      actions={<>
                        <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate(unit.id)} isLoading={toggleMutation.isPending && toggleMutation.variables === unit.id}>
                          {unit.isActive ? t('units.disable') : t('units.enable')}
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={() => openEdit(unit)}>
                          {t('common.edit')}
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} onClick={() => setDeleteModal({ open: true, unit })} className="text-red-500 hover:text-red-700">
                          {t('common.delete')}
                        </Button>
                      </>}
                    >
                      <p className="text-xs text-text-secondary font-body">
                        {t('units.sortLabel', { order: unit.sortOrder })}
                      </p>
                    </ListItem>
                  </div>
                ))}
              </div>
            )}
            <Pagination
              currentPage={meta.currentPage}
              lastPage={meta.lastPage}
              total={meta.total}
              perPage={50}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </Card>
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.unit ? t('units.modal.editTitle') : t('units.modal.createTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('units.modal.code')}</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              placeholder="e.g. KG"
            />
          </div>
          <TranslatedField
            label={t('units.modal.name')}
            values={form.names}
            onChange={(key, val) => setForm({ ...form, names: { ...form.names, [key]: val } })}
            placeholder={t('units.modal.namePlaceholder')}
            required
          />
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('units.modal.sortOrder')}</label>
            <input
              type="number" min="0"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-text-primary font-body cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-brand-primary" />
            {t('common.active')}
          </label>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModal({ open: false })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={saveMutation.isPending}>
              {modal.unit ? t('common.save') : t('units.modal.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, unit: null })}
        size="sm"
        title={t('units.deleteTitle')}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
            <Trash2 size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary font-body">
              {t('units.deleteConfirm', { name: deleteModal.unit?.nameAr })}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteModal({ open: false, unit: null })}>{t('common.cancel')}</Button>
            <Button
              variant="danger" size="sm" leftIcon={<Trash2 size={14} />}
              isLoading={deleteMutation.isPending}
              onClick={() => deleteModal.unit && deleteMutation.mutate(deleteModal.unit.id)}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
