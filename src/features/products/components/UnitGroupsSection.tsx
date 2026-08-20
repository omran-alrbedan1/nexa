import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitsApi, type ProductUnit, type UnitGroup, type UnitGroupInput } from '../api/unitsApi';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListItem } from '@/components/ui/ListItem';
import { Pagination } from '@/components/ui/Pagination';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';
import { useToastStore } from '@/stores/toastStore';
import { Layers2, Plus, Pencil, Trash2, Hash, Package } from 'lucide-react';

const unitLabel = (unit: ProductUnit, lang: string): string => {
  const key = lang === 'ar' ? 'nameAr' : lang === 'he' ? 'nameHe' : lang === 'ru' ? 'nameRu' : 'nameEn';
  return (unit[key] as string | null) || unit.nameEn || unit.nameAr || unit.code;
};

const EMPTY_FORM = {
  code: '',
  names: {} as Partial<Record<TranslatedLang, string>>,
  sortOrder: '0',
  isActive: true,
  unitIds: [] as number[],
};

export function UnitGroupsSection() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; group?: UnitGroup }>({ open: false });
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; group: UnitGroup | null }>({ open: false, group: null });
  const [availableUnits, setAvailableUnits] = useState<ProductUnit[]>([]);

  useEffect(() => {
    unitsApi.list({ page: 1 }).then((d) => setAvailableUnits(d.units)).catch(() => setAvailableUnits([]));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['unit-groups', page, search],
    queryFn: () => unitsApi.groupList({ page, search }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['unit-groups'] });
    queryClient.invalidateQueries({ queryKey: ['product-units'] });
  };

  const saveMutation = useMutation({
    mutationFn: (input: UnitGroupInput & { id?: number }) => {
      if (input.id) {
        const { id, ...rest } = input;
        return unitsApi.groupUpdate(id, rest);
      }
      return unitsApi.groupCreate(input);
    },
    onSuccess: () => {
      invalidate();
      addToast('success', modal.group ? t('units.groups.toast.updated') : t('units.groups.toast.created'));
      setModal({ open: false });
    },
    onError: (err: any) => {
      addToast('error', err?.response?.data?.message || t('units.groups.toast.saveFailed'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => unitsApi.groupToggle(id),
    onSuccess: () => {
      invalidate();
      addToast('success', t('units.groups.toast.toggled'));
    },
    onError: (err: any) => addToast('error', err?.response?.data?.message || t('units.groups.toast.toggleFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => unitsApi.groupDelete(id),
    onSuccess: () => {
      invalidate();
      addToast('success', t('units.groups.toast.deleted'));
      setDeleteModal({ open: false, group: null });
    },
    onError: (err: any) => addToast('error', err?.response?.data?.message || t('units.groups.toast.deleteFailed')),
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true });
  };

  const openEdit = (group: UnitGroup) => {
    setForm({
      code: group.code,
      names: { ar: group.nameAr, en: group.nameEn ?? '', he: group.nameHe ?? '', ru: group.nameRu ?? '' },
      sortOrder: String(group.sortOrder ?? 0),
      isActive: group.isActive,
      unitIds: group.unitIds ?? [],
    });
    setModal({ open: true, group });
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.names.ar?.trim()) {
      addToast('error', t('units.validation.required'));
      return;
    }
    saveMutation.mutate({
      id: modal.group?.id,
      ...(!modal.group ? { code: form.code.trim() } : {}),
      name_ar: form.names.ar ?? '',
      name_en: form.names.en || null,
      name_he: form.names.he || null,
      name_ru: form.names.ru || null,
      sort_order: parseInt(form.sortOrder, 10) || 0,
      is_active: form.isActive,
      unit_ids: form.unitIds,
    });
  };

  const groups = data?.groups ?? [];
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, total: 0 };

  const toggleUnit = (id: number) => {
    setForm((prev) => ({
      ...prev,
      unitIds: prev.unitIds.includes(id) ? prev.unitIds.filter((u) => u !== id) : [...prev.unitIds, id],
    }));
  };

  return (
    <>
      <Card padding="lg">
        <CardHeader
          action={
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
              {t('units.groups.addGroup')}
            </Button>
          }
        >
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('units.groups.allGroups')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{meta.total} {t('common.items')}</p>
          </div>
        </CardHeader>

        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('units.groups.searchPlaceholder')}
            className="w-full max-w-sm px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
        ) : groups.length === 0 ? (
          <EmptyState title={t('units.groups.noGroups')} description={t('units.groups.noGroupsDescription')} action={
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
              {t('units.groups.addGroup')}
            </Button>
          } />
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <ListItem
                key={group.id}
                icon={<Layers2 size={16} className="text-brand-primary" />}
                iconClassName="bg-brand-primary-light"
                title={<span className="text-sm font-bold text-text-primary font-body truncate">{group.nameAr}</span>}
                badges={<>
                  {group.nameEn && <span className="text-xs text-text-tertiary truncate hidden sm:inline">{group.nameEn}</span>}
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                    <Hash size={10} />
                    {group.code}
                  </span>
                  <Badge variant="teal" size="sm">{t('units.groups.unitsCount', { count: group.unitsCount ?? 0 })}</Badge>
                  <Badge variant={group.isActive ? 'green' : 'red'} size="sm">
                    {group.isActive ? t('common.active') : t('common.inactive')}
                  </Badge>
                </>}
                actions={<>
                  <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate(group.id)} isLoading={toggleMutation.isPending && toggleMutation.variables === group.id}>
                    {group.isActive ? t('units.disable') : t('units.enable')}
                  </Button>
                  <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={() => openEdit(group)}>
                    {t('common.edit')}
                  </Button>
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} onClick={() => setDeleteModal({ open: true, group })} className="text-red-500 hover:text-red-700">
                    {t('common.delete')}
                  </Button>
                </>}
              >
                <p className="text-xs text-text-secondary font-body">{t('units.groups.description')}</p>
              </ListItem>
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

      {/* Create/Edit Group Modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.group ? t('units.groups.editTitle') : t('units.groups.createTitle')}
        size="lg"
      >
        <div className="space-y-4">
          {!modal.group && (
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('units.groups.code')}</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
                placeholder="e.g. CLOTHING-SIZES"
              />
            </div>
          )}
          <TranslatedField
            label={t('units.groups.name')}
            values={form.names}
            onChange={(key, val) => setForm({ ...form, names: { ...form.names, [key]: val } })}
            placeholder={t('units.groups.namePlaceholder')}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('units.modal.sortOrder')}</label>
              <input
                type="number" min="0"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-text-primary font-body cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-brand-primary" />
                {t('common.active')}
              </label>
            </div>
          </div>
          <div>
            <p className="block text-xs font-bold text-text-secondary mb-2 font-body">{t('units.groups.memberUnits')}</p>
            <div className="max-h-48 overflow-y-auto border border-border-default rounded-xl divide-y divide-border-default/50">
              {availableUnits.length === 0 ? (
                <div className="p-4 text-sm text-text-tertiary font-body text-center">{t('units.groups.noUnits')}</div>
              ) : (
                availableUnits.map((unit) => {
                  const checked = form.unitIds.includes(unit.id);
                  return (
                    <label key={unit.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-brand-primary-light/40' : 'hover:bg-bg-section-alt'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUnit(unit.id)}
                        className="w-4 h-4 accent-brand-primary flex-shrink-0"
                      />
                      <Package size={14} className="text-brand-primary shrink-0" />
                      <span className="text-sm font-bold text-text-primary font-body flex-1 min-w-0 truncate">{unitLabel(unit, i18n.language)}</span>
                      <span className="text-xs font-mono text-text-tertiary">{unit.code}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModal({ open: false })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={saveMutation.isPending}>
              {modal.group ? t('common.save') : t('units.groups.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Group Modal */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, group: null })}
        size="sm"
        title={t('units.groups.deleteTitle')}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
            <Trash2 size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary font-body">
              {t('units.groups.deleteConfirm', { name: deleteModal.group?.nameAr })}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteModal({ open: false, group: null })}>{t('common.cancel')}</Button>
            <Button
              variant="danger" size="sm" leftIcon={<Trash2 size={14} />}
              isLoading={deleteMutation.isPending}
              onClick={() => deleteModal.group && deleteMutation.mutate(deleteModal.group.id)}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}