import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Table } from '@/components/ui/Table';
import type { ProductSize, ProductSizeInput } from '../api/productSizesApi';
import {
  useCreateProductSize,
  useDeleteProductSize,
  useProductSizes,
  useToggleProductSize,
  useUpdateProductSize,
} from '../hooks/useProductSizes';
import { useToastStore } from '@/stores/toastStore';

const PER_PAGE = 15;

interface SizeFormState {
  code: string;
  nameAr: string;
  nameEn: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: SizeFormState = {
  code: '',
  nameAr: '',
  nameEn: '',
  sortOrder: '0',
  isActive: true,
};

export function ProductSizesPage() {
  const { t } = useTranslation();
  const addToast = useToastStore((state) => state.addToast);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formModal, setFormModal] = useState<{ open: boolean; size?: ProductSize }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<ProductSize | null>(null);
  const [form, setForm] = useState<SizeFormState>(EMPTY_FORM);

  const params = {
    page,
    search: search || undefined,
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
    per_page: PER_PAGE,
  };
  const { data, isLoading, isError, error, refetch } = useProductSizes(params);
  const createMutation = useCreateProductSize();
  const updateMutation = useUpdateProductSize();
  const toggleMutation = useToggleProductSize();
  const deleteMutation = useDeleteProductSize();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormModal({ open: true });
  };

  const openEdit = (size: ProductSize) => {
    setForm({
      code: size.code,
      nameAr: size.nameAr,
      nameEn: size.nameEn ?? '',
      sortOrder: String(size.sortOrder),
      isActive: size.isActive,
    });
    setFormModal({ open: true, size });
  };

  const closeForm = () => setFormModal({ open: false });

  const handleSave = () => {
    const code = form.code.trim();
    const nameAr = form.nameAr.trim();
    if (!code || !nameAr) {
      addToast('error', t('productSizes.form.required'));
      return;
    }

    const payload: ProductSizeInput = {
      code,
      name_ar: nameAr,
      name_en: form.nameEn.trim() || null,
      sort_order: Number.parseInt(form.sortOrder, 10) || 0,
      is_active: form.isActive,
    };

    if (formModal.size) {
      updateMutation.mutate(
        { id: formModal.size.id, data: payload },
        { onSuccess: closeForm }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: closeForm });
    }
  };

  const sizes = data?.sizes ?? [];
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: PER_PAGE, total: 0 };
  const savePending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-teal-500/10 via-teal-50 to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
            <Ruler size={22} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">
              {t('productSizes.title')}
            </h1>
            <p className="text-sm text-text-secondary font-body">{t('productSizes.description')}</p>
          </div>
        </div>
      </div>

      {isError ? (
        <ErrorState
          title={t('productSizes.errors.loadTitle')}
          message={error instanceof Error ? error.message : t('productSizes.errors.loadMessage')}
          onRetry={() => refetch()}
        />
      ) : (
        <Card padding="lg">
          <CardHeader
            action={
              <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
                {t('productSizes.add')}
              </Button>
            }
          >
            <div>
              <h2 className="text-sm font-bold text-text-primary font-display">{t('productSizes.all')}</h2>
              <p className="text-xs text-text-secondary mt-0.5">{meta.total} {t('common.items')}</p>
            </div>
          </CardHeader>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(1); }}
              placeholder={t('productSizes.searchPlaceholder')}
              className="sm:w-80"
            />
            <select
              value={activeFilter}
              onChange={(event) => {
                setActiveFilter(event.target.value as typeof activeFilter);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            >
              <option value="all">{t('productSizes.filters.all')}</option>
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
            </select>
          </div>

          {!isLoading && sizes.length === 0 ? (
            <EmptyState
              title={t('productSizes.empty.title')}
              description={t('productSizes.empty.description')}
              action={
                <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
                  {t('productSizes.add')}
                </Button>
              }
            />
          ) : (
            <Table
              data={sizes}
              isLoading={isLoading}
              keyExtractor={(size) => size.id}
              columns={[
                { key: 'code', header: t('productSizes.columns.code'), render: (size) => <span className="font-mono font-bold">{size.code}</span> },
                { key: 'nameAr', header: t('productSizes.columns.nameAr') },
                { key: 'nameEn', header: t('productSizes.columns.nameEn'), render: (size) => size.nameEn || '—' },
                { key: 'sortOrder', header: t('productSizes.columns.sortOrder') },
                {
                  key: 'status',
                  header: t('productSizes.columns.status'),
                  render: (size) => (
                    <Badge variant={size.isActive ? 'green' : 'red'} size="sm">
                      {size.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: t('productSizes.columns.actions'),
                  render: (size) => (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMutation.mutate(size.id)}
                        isLoading={toggleMutation.isPending && toggleMutation.variables === size.id}
                      >
                        {size.isActive ? t('productSizes.disable') : t('productSizes.enable')}
                      </Button>
                      <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={() => openEdit(size)}>
                        {t('common.edit')}
                      </Button>
                      <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} className="text-red-500" onClick={() => setDeleteTarget(size)}>
                        {t('common.delete')}
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}

          <Pagination
            currentPage={meta.currentPage}
            lastPage={meta.lastPage}
            total={meta.total}
            perPage={meta.perPage}
            onPageChange={setPage}
          />
        </Card>
      )}

      <Modal
        open={formModal.open}
        onClose={closeForm}
        title={formModal.size ? t('productSizes.form.editTitle') : t('productSizes.form.createTitle')}
      >
        <div className="space-y-4">
          <Input label={t('productSizes.form.code')} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="S, M, L, XL" required />
          <Input label={t('productSizes.form.nameAr')} value={form.nameAr} onChange={(event) => setForm({ ...form, nameAr: event.target.value })} dir="rtl" required />
          <Input label={t('productSizes.form.nameEn')} value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} dir="ltr" />
          <Input label={t('productSizes.form.sortOrder')} type="number" min="0" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
          <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="accent-brand-primary" />
            {t('common.active')}
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={closeForm}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={savePending}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('productSizes.delete.title')}
        message={t('productSizes.delete.message', { name: deleteTarget?.nameAr })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </div>
  );
}
