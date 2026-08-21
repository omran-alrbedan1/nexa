import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { unitsApi, type ProductUnit, type UnitGroup } from '../api/unitsApi';
import { UnitMultiPickerModal, type BulkUnitItem } from './UnitMultiPickerModal';
import { Package, Plus, Pencil, Trash2, Layers, AlertTriangle, Layers2 } from 'lucide-react';

export interface VariantDraft {
  id?: number;
  unit_id?: number;
  name_ar: string;
  name_en?: string;
  name_he?: string;
  name_ru?: string;
  sku?: string;
  price: number;
  stock_quantity: number;
  is_active?: boolean;
  _delete?: boolean;
}

interface VariantEditorProps {
  value: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
  units?: ProductUnit[];
  productNames?: Partial<Record<'ar' | 'en' | 'he' | 'ru', string>>;
  productSku?: string;
}

interface DraftState {
  unit_id: string;
  names: Partial<Record<'ar' | 'en' | 'he' | 'ru', string>>;
  sku: string;
  price: string;
  stock_quantity: string;
  is_active: boolean;
}

export function VariantEditor({ value, onChange, units = [], productNames = {}, productSku = '' }: VariantEditorProps) {
  const { t, i18n } = useTranslation();
  const [modal, setModal] = useState<{ open: boolean; index?: number }>({ open: false });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [groups, setGroups] = useState<UnitGroup[]>([]);
  const [unitSearch, setUnitSearch] = useState('');
  const [draft, setDraft] = useState<DraftState>({
    unit_id: '', names: {}, sku: '', price: '', stock_quantity: '0', is_active: true,
  });

  const unitName = (unit?: ProductUnit | null): string => {
    if (!unit) return '';
    const lang: keyof ProductUnit = i18n.language === 'ar' ? 'nameAr' : i18n.language === 'he' ? 'nameHe' : i18n.language === 'ru' ? 'nameRu' : 'nameEn';
    return unit[lang] || unit.nameEn || unit.nameAr || unit.code;
  };

  const selectedUnit = units.find((u) => String(u.id) === draft.unit_id);

  const filteredUnits = useMemo(() => {
    const q = unitSearch.trim().toLowerCase();
    if (!q) return units;
    return units.filter((u) => [u.code, u.nameAr, u.nameEn, u.nameHe, u.nameRu].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q)));
  }, [units, unitSearch]);

  const autoNames = useMemo(() => {
    if (!selectedUnit) return null;
    const join = (productName: string | undefined, unitName: string): string =>
      productName?.trim() ? `${productName.trim()} ${unitName}`.trim() : unitName;
    return {
      ar: join(productNames.ar, selectedUnit.nameAr),
      en: join(productNames.en ?? productNames.ar, selectedUnit.nameEn ?? selectedUnit.nameAr),
      he: productNames.he ? join(productNames.he, selectedUnit.nameHe ?? selectedUnit.nameEn ?? '') : undefined,
      ru: productNames.ru ? join(productNames.ru, selectedUnit.nameRu ?? selectedUnit.nameEn ?? '') : undefined,
    };
  }, [selectedUnit, productNames]);

  const autoSku = useMemo(() => {
    if (!selectedUnit) return null;
    const base = `${productSku || 'PROD'}-${selectedUnit.code}`;
    const collision = value.some((v, i) => modal.index != null && i === modal.index ? false : v.sku === base);
    return collision ? `${base}-2` : base;
  }, [selectedUnit, productSku, value, modal.index]);

  const duplicateUnit = useMemo(() => {
    if (!selectedUnit) return false;
    return value.some((v, i) => (modal.index == null || i !== modal.index) && v.unit_id === selectedUnit.id);
  }, [selectedUnit, value, modal.index]);

  const totalStock = value.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

  const openCreate = () => {
    setUnitSearch('');
    setDraft({ unit_id: String(units[0]?.id ?? ''), names: {}, sku: '', price: '', stock_quantity: '0', is_active: true });
    setModal({ open: true });
  };

  const openEdit = (index: number) => {
    const v = value[index];
    setUnitSearch('');
    setDraft({
      unit_id: v.unit_id != null ? String(v.unit_id) : '',
      names: { ar: v?.name_ar ?? '', en: v?.name_en ?? '', he: v?.name_he ?? '', ru: v?.name_ru ?? '' },
      sku: v?.sku ?? '',
      price: v?.price != null ? String(v.price) : '',
      stock_quantity: v?.stock_quantity != null ? String(v.stock_quantity) : '0',
      is_active: v?.is_active ?? true,
    });
    setModal({ open: true, index });
  };

  const handleSave = () => {
    const variant: VariantDraft = {
      ...(modal.index != null ? { id: value[modal.index].id } : {}),
      ...(selectedUnit ? { unit_id: selectedUnit.id } : {}),
      ...(selectedUnit && autoNames ? {
        name_ar: autoNames.ar,
        ...(autoNames.en ? { name_en: autoNames.en } : {}),
        ...(autoNames.he ? { name_he: autoNames.he } : {}),
        ...(autoNames.ru ? { name_ru: autoNames.ru } : {}),
      } : {
        name_ar: draft.names.ar ?? '',
        ...(draft.names.en ? { name_en: draft.names.en } : {}),
        ...(draft.names.he ? { name_he: draft.names.he } : {}),
        ...(draft.names.ru ? { name_ru: draft.names.ru } : {}),
      }),
      ...(selectedUnit ? { sku: autoSku ?? undefined } : (draft.sku ? { sku: draft.sku } : {})),
      price: parseFloat(draft.price) || 0,
      stock_quantity: parseInt(draft.stock_quantity, 10) || 0,
      is_active: draft.is_active,
    };
    const next = [...value];
    if (modal.index != null) {
      next[modal.index] = variant;
    } else {
      next.push(variant);
    }
    onChange(next);
    setModal({ open: false });
  };

  const canSave = selectedUnit
    ? !duplicateUnit && !!draft.price
    : !!draft.names.ar?.trim() && !!draft.price;

  const handleBulkAdd = (items: BulkUnitItem[]) => {
    const build = (item: BulkUnitItem): VariantDraft => {
      const unit = item.unit;
      const join = (productName: string | undefined, unitName: string): string =>
        productName?.trim() ? `${productName.trim()} ${unitName}`.trim() : unitName;

      return {
        unit_id: unit.id,
        name_ar: join(productNames.ar, unit.nameAr),
        ...(productNames.en ?? productNames.ar ? { name_en: join(productNames.en ?? productNames.ar, unit.nameEn ?? unit.nameAr) } : {}),
        ...(productNames.he && unit.nameHe ? { name_he: join(productNames.he, unit.nameHe) } : {}),
        ...(productNames.ru && unit.nameRu ? { name_ru: join(productNames.ru, unit.nameRu) } : {}),
        sku: `${productSku || 'PROD'}-${unit.code}`,
        price: parseFloat(item.price) || 0,
        stock_quantity: parseInt(item.stockQuantity || '0', 10) || 0,
        is_active: true,
      };
    };

    const existing = new Set(value.map((v) => v.unit_id).filter((v): v is number => v != null));
    const next = [...value];
    items.forEach((item) => {
      if (existing.has(item.unit.id)) return;
      existing.add(item.unit.id);
      next.push(build(item));
    });
    onChange(next);
  };

  const openBulk = () => {
    if (groups.length === 0) {
      unitsApi.groupList({ page: 1 }).then((d) => setGroups(d.groups)).catch(() => setGroups([]));
    }
    setBulkOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-purple-600" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('products.variants.title', 'Variants')}</h3>
          {value.length > 0 && <Badge variant="teal" size="sm">{value.length}</Badge>}
        </div>
        <div className="flex items-center gap-3">
          {value.length > 0 && (
            <span className="text-xs text-text-secondary font-body">
              {t('products.variants.totalStock', 'Total stock')}: <b className="text-text-primary">{totalStock}</b>
            </span>
          )}
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
            {t('products.variants.addVariant', 'Add Variant')}
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Layers2 size={14} />} onClick={openBulk}>
            {t('products.variants.addMultiple', 'Add multiple')}
          </Button>
        </div>
      </div>

      {value.length === 0 ? (
        <EmptyState
          title={t('products.variants.noVariants', 'No variants')}
          description={t('products.variants.addFirstUnit', 'Add your first variant (e.g. size, packaging)')}
        />
      ) : (
        <div className="space-y-2">
          {value.map((variant, index) => {
            const unit = units.find((u) => u.id === variant.unit_id);
            return (
              <div
                key={variant.id ?? `new-${index}`}
                className="flex items-center justify-between gap-3 p-3 border border-border-default rounded-xl bg-bg-card"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Package size={14} className="text-brand-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary font-body truncate">
                      {unit ? unitName(unit) : (variant.name_ar || t('products.variants.selectUnit', 'Select a unit'))}
                    </p>
                    <p className="text-xs text-text-secondary font-body">
                      {variant.price} · {t('products.variants.stock', 'Stock')}: {variant.stock_quantity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {variant.is_active ? (
                    <Badge variant="green" size="sm">{t('common.active')}</Badge>
                  ) : (
                    <Badge variant="red" size="sm">{t('common.inactive')}</Badge>
                  )}
                  <Button variant="secondary" size="sm" leftIcon={<Pencil size={12} />} onClick={() => openEdit(index)}>{t('common.edit')}</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 size={12} />}
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.index != null ? t('products.variants.editTitle', 'Edit Variant') : t('products.variants.createTitle', 'Create Variant')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('products.variants.unit', 'Unit')}</label>
            <input
              value={unitSearch}
              onChange={(e) => setUnitSearch(e.target.value)}
              placeholder={t('products.variants.searchUnits', 'Search units…')}
              className="w-full mb-2 px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
            <select
              value={draft.unit_id}
              onChange={(e) => setDraft({ ...draft, unit_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            >
              <option value="">{t('products.variants.selectUnit', 'Select a unit')}</option>
              {filteredUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>{unitName(unit)} ({unit.code})</option>
              ))}
            </select>
          </div>

          {duplicateUnit && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-body">{t('products.variants.duplicateUnit', 'Another variant already uses this unit')}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('products.variants.price', 'Price')}</label>
              <input type="number" step="0.01" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('products.variants.stock', 'Stock Quantity')}</label>
              <input type="number" min="0" value={draft.stock_quantity} onChange={(e) => setDraft({ ...draft, stock_quantity: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-text-primary font-body cursor-pointer">
            <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="accent-brand-primary" />
            {t('common.active')}
          </label>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModal({ open: false })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!canSave}>
              {modal.index != null ? t('common.save') : t('products.variants.create', 'Create')}
            </Button>
          </div>
        </div>
      </Modal>

      <UnitMultiPickerModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        units={units}
        groups={groups}
        existingUnitIds={[]}
        usedUnitIds={value.map((v) => v.unit_id).filter((v): v is number => v != null)}
        onAdd={handleBulkAdd}
      />
    </div>
  );
}
