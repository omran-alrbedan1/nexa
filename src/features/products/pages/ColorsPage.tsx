import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useToastStore } from '@/stores/toastStore';
import type { GlobalColor, GlobalColorInput } from '../api/colorsApi';
import {
  useColors,
  useCreateColor,
  useDeleteColor,
  useToggleColor,
  useUpdateColor,
} from '../hooks/useColors';

const PER_PAGE = 15;
const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

interface ColorFormState {
  code: string;
  nameAr: string;
  nameEn: string;
  hex: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: ColorFormState = {
  code: '',
  nameAr: '',
  nameEn: '',
  hex: '#000000',
  sortOrder: '0',
  isActive: true,
};

export function ColorsPage() {
  const { t } = useTranslation();
  const addToast = useToastStore((state) => state.addToast);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formModal, setFormModal] = useState<{ open: boolean; color?: GlobalColor }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<GlobalColor | null>(null);
  const [form, setForm] = useState<ColorFormState>(EMPTY_FORM);

  const params = {
    page,
    search: search || undefined,
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
    per_page: PER_PAGE,
  };
  const { data, isLoading, isError, error, refetch } = useColors(params);
  const createMutation = useCreateColor();
  const updateMutation = useUpdateColor();
  const toggleMutation = useToggleColor();
  const deleteMutation = useDeleteColor();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormModal({ open: true });
  };

  const openEdit = (color: GlobalColor) => {
    setForm({
      code: color.code,
      nameAr: color.nameAr,
      nameEn: color.nameEn ?? '',
      hex: color.hex ?? '#000000',
      sortOrder: String(color.sortOrder),
      isActive: color.isActive,
    });
    setFormModal({ open: true, color });
  };

  const closeForm = () => setFormModal({ open: false });

  const handleSave = () => {
    const code = form.code.trim();
    const nameAr = form.nameAr.trim();
    const hex = form.hex.trim();
    if (!code || !nameAr) {
      addToast('error', t('colors.form.required'));
      return;
    }
    if (hex && !HEX_PATTERN.test(hex)) {
      addToast('error', t('colors.form.invalidHex'));
      return;
    }

    const payload: GlobalColorInput = {
      code,
      name_ar: nameAr,
      name_en: form.nameEn.trim() || null,
      hex: hex || null,
      sort_order: Number.parseInt(form.sortOrder, 10) || 0,
      is_active: form.isActive,
    };

    if (formModal.color) {
      updateMutation.mutate({ id: formModal.color.id, data: payload }, { onSuccess: closeForm });
    } else {
      createMutation.mutate(payload, { onSuccess: closeForm });
    }
  };

  const colors = data?.colors ?? [];
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: PER_PAGE, total: 0 };
  const savePending = createMutation.isPending || updateMutation.isPending;
  const previewHex = HEX_PATTERN.test(form.hex.trim()) ? form.hex.trim() : '#ffffff';

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-teal-500/10 via-teal-50 to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
            <Palette size={22} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('colors.title')}</h1>
            <p className="text-sm text-text-secondary font-body">{t('colors.description')}</p>
          </div>
        </div>
      </div>

      {isError ? (
        <ErrorState
          title={t('colors.errors.loadTitle')}
          message={error instanceof Error ? error.message : t('colors.errors.loadMessage')}
          onRetry={() => refetch()}
        />
      ) : (
        <Card padding="lg">
          <CardHeader
            action={<Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>{t('colors.add')}</Button>}
          >
            <div>
              <h2 className="text-sm font-bold text-text-primary font-display">{t('colors.all')}</h2>
              <p className="text-xs text-text-secondary mt-0.5">{meta.total} {t('common.items')}</p>
            </div>
          </CardHeader>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(1); }}
              placeholder={t('colors.searchPlaceholder')}
              className="sm:w-80"
            />
            <select
              value={activeFilter}
              onChange={(event) => { setActiveFilter(event.target.value as typeof activeFilter); setPage(1); }}
              className="px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            >
              <option value="all">{t('colors.filters.all')}</option>
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
            </select>
          </div>

          {!isLoading && colors.length === 0 ? (
            <EmptyState
              title={t('colors.empty.title')}
              description={t('colors.empty.description')}
              action={<Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>{t('colors.add')}</Button>}
            />
          ) : (
            <Table
              data={colors}
              isLoading={isLoading}
              keyExtractor={(color) => color.id}
              columns={[
                {
                  key: 'color',
                  header: t('colors.columns.color'),
                  render: (color) => (
                    <span className="inline-flex items-center gap-2 font-mono">
                      <span
                        className="h-5 w-5 rounded-md border border-border-default shadow-sm"
                        style={{ backgroundColor: color.hex ?? 'transparent' }}
                        aria-label={color.hex ?? t('colors.noHex')}
                      />
                      {color.hex || '—'}
                    </span>
                  ),
                },
                { key: 'code', header: t('colors.columns.code'), render: (color) => <span className="font-mono font-bold">{color.code}</span> },
                { key: 'nameAr', header: t('colors.columns.nameAr') },
                { key: 'nameEn', header: t('colors.columns.nameEn'), render: (color) => color.nameEn || '—' },
                { key: 'hex', header: t('colors.columns.hex'), render: (color) => color.hex || '—' },
                { key: 'sortOrder', header: t('colors.columns.sortOrder') },
                {
                  key: 'status',
                  header: t('colors.columns.status'),
                  render: (color) => <Badge variant={color.isActive ? 'green' : 'red'} size="sm">{color.isActive ? t('common.active') : t('common.inactive')}</Badge>,
                },
                {
                  key: 'actions',
                  header: t('colors.columns.actions'),
                  render: (color) => (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate(color.id)} isLoading={toggleMutation.isPending && toggleMutation.variables === color.id}>
                        {color.isActive ? t('colors.disable') : t('colors.enable')}
                      </Button>
                      <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={() => openEdit(color)}>{t('common.edit')}</Button>
                      <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} className="text-red-500" onClick={() => setDeleteTarget(color)}>{t('common.delete')}</Button>
                    </div>
                  ),
                },
              ]}
            />
          )}

          <Pagination currentPage={meta.currentPage} lastPage={meta.lastPage} total={meta.total} perPage={meta.perPage} onPageChange={setPage} />
        </Card>
      )}

      <Modal open={formModal.open} onClose={closeForm} title={formModal.color ? t('colors.form.editTitle') : t('colors.form.createTitle')}>
        <div className="space-y-4">
          <Input label={t('colors.form.code')} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="BLACK, WHITE, RED" required />
          <Input label={t('colors.form.nameAr')} value={form.nameAr} onChange={(event) => setForm({ ...form, nameAr: event.target.value })} dir="rtl" required />
          <Input label={t('colors.form.nameEn')} value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} dir="ltr" />
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <Input label={t('colors.form.hex')} value={form.hex} onChange={(event) => setForm({ ...form, hex: event.target.value })} placeholder="#E53935" dir="ltr" />
            <input
              type="color"
              value={previewHex}
              onChange={(event) => setForm({ ...form, hex: event.target.value.toUpperCase() })}
              className="h-[42px] w-14 cursor-pointer rounded-lg border border-border-default bg-bg-input p-1"
              aria-label={t('colors.form.preview')}
            />
          </div>
          <Input label={t('colors.form.sortOrder')} type="number" min="0" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
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
        title={t('colors.delete.title')}
        message={t('colors.delete.message', { name: deleteTarget?.nameAr })}
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
