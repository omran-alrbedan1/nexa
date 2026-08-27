import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListItem } from '@/components/ui/ListItem';
import { unitsApi, type ProductUnit, type UnitGroup } from '../api/unitsApi';
import type { ProductColor } from '../api/productColorsApi';
import { useProductColors } from '../hooks/useProductColors';
import { DollarSign, Package, Plus, Pencil, Trash2, Layers, AlertTriangle, Layers2 } from 'lucide-react';
import { useProductVariants, useCreateProductVariant, useUpdateProductVariant, useToggleProductVariant, useDeleteProductVariant, variantKeys } from '../hooks/useProductVariants';
import { productVariantsApi, type ProductVariant, type VariantFormData } from '../api/productsApi';
import { UnitMultiPickerModal, type BulkUnitItem } from './UnitMultiPickerModal';

interface VariantsSectionProps {
  productId: number;
  productNameAr?: string;
  productNameEn?: string;
  productNameHe?: string;
  productNameRu?: string;
  productSku?: string;
}

function VariantFormModal({
  open,
  onClose,
  onSave,
  isSaving,
  editing,
  units,
  colors,
  productNames,
  productSku,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: VariantFormData) => void;
  isSaving: boolean;
  editing?: ProductVariant | null;
  units: ProductUnit[];
  colors: ProductColor[];
  productNames: Partial<Record<'ar' | 'en' | 'he' | 'ru', string>>;
  productSku: string;
  existing: ProductVariant[];
}) {
  const { t, i18n } = useTranslation();
  const [unitSearch, setUnitSearch] = useState('');
  const [form, setForm] = useState<{ unit_id: string; color_id: string; names: Partial<Record<'ar' | 'en' | 'he' | 'ru', string>>; sku: string; price: string; stock_quantity: string }>(() => ({
    unit_id: editing?.unit_id != null ? String(editing.unit_id) : String(units[0]?.id ?? ''),
    color_id: editing?.color_id != null ? String(editing.color_id) : '',
    names: { ar: editing?.name_ar ?? '', en: editing?.name_en ?? '', he: editing?.name_he ?? '', ru: editing?.name_ru ?? '' },
    sku: editing?.sku ?? '',
    price: editing ? String(editing.price) : '',
    stock_quantity: editing ? String(editing.stock_quantity) : '0',
  }));

  const filteredUnits = useMemo(() => {
    const q = unitSearch.trim().toLowerCase();
    if (!q) return units;
    return units.filter((u) => [u.code, u.nameAr, u.nameEn, u.nameHe, u.nameRu].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q)));
  }, [units, unitSearch]);

  const unitName = (unit?: ProductUnit | null): string => {
    if (!unit) return '';
    const lang: keyof ProductUnit = i18n.language === 'ar' ? 'nameAr' : i18n.language === 'he' ? 'nameHe' : i18n.language === 'ru' ? 'nameRu' : 'nameEn';
    return unit[lang] || unit.nameEn || unit.nameAr || unit.code;
  };

  const selectedUnit = units.find((u) => String(u.id) === form.unit_id);
  const selectedColor = colors.find((c) => String(c.id) === form.color_id);

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
    const collision = existing.some((v) => editing ? v.id !== editing.id : v.sku === base);
    return collision ? `${base}-2` : base;
  }, [selectedUnit, productSku, existing, editing]);

  const duplicateUnit = useMemo(() => {
    if (!selectedUnit) return false;
    return existing.some((v) => (editing ? v.id !== editing.id : true) && v.unit_id === selectedUnit.id);
  }, [selectedUnit, existing, editing]);

  const handleSave = () => {
    onSave({
      ...(selectedUnit ? { unit_id: selectedUnit.id } : {}),
      ...(selectedColor ? { color_id: selectedColor.id } : {}),
      ...(selectedUnit && autoNames ? {
        name_ar: autoNames.ar,
        ...(autoNames.en ? { name_en: autoNames.en } : {}),
        ...(autoNames.he ? { name_he: autoNames.he } : {}),
        ...(autoNames.ru ? { name_ru: autoNames.ru } : {}),
      } : {
        name_ar: form.names.ar ?? '',
        ...(form.names.en ? { name_en: form.names.en } : {}),
        ...(form.names.he ? { name_he: form.names.he } : {}),
        ...(form.names.ru ? { name_ru: form.names.ru } : {}),
      }),
      ...(selectedUnit ? { sku: autoSku ?? undefined } : (form.sku ? { sku: form.sku } : {})),
      price: parseFloat(form.price) || 0,
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
    });
  };

  const canSave = selectedUnit
    ? !duplicateUnit && !!form.price
    : !!form.names.ar?.trim() && !!form.price;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('products.variants.editTitle', 'Edit Variant') : t('products.variants.createTitle', 'Create Variant')}
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
            value={form.unit_id}
            onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
          >
            <option value="">{t('products.variants.selectUnit', 'Select a unit')}</option>
            {filteredUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>{unitName(unit)} ({unit.code})</option>
            ))}
              </select>
            </div>

            {colors.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('products.variants.color', 'Color')}</label>
                <select
                  value={form.color_id}
                  onChange={(e) => setForm({ ...form, color_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
                >
                  <option value="">{t('products.variants.selectColor', 'Select a color')}</option>
                  {colors.map((color) => (
                    <option key={color.id} value={color.id}>{i18n.language === 'ar' ? color.nameAr || color.nameEn || color.code : color.nameEn || color.nameAr || color.code} ({color.code})</option>
                  ))}
                </select>
              </div>
            )}

            {duplicateUnit && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-body">{t('products.variants.duplicateUnit', 'Another variant already uses this unit')}</p>
            </div>
          )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('products.variants.price', 'Price')}</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('products.variants.stock', 'Stock Quantity')}</label>
            <input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave} disabled={!canSave}>
            {editing ? t('common.save') : t('products.variants.create', 'Create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function VariantsSection({ productId, productNameAr, productNameEn, productNameHe, productNameRu, productSku }: VariantsSectionProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: variants, isLoading } = useProductVariants(productId);
  const productColorsQuery = useProductColors(productId);
  const productColors = productColorsQuery.data ?? [];
  const createVariant = useCreateProductVariant(productId);
  const updateVariant = useUpdateProductVariant(productId);
  const toggleVariant = useToggleProductVariant(productId);
  const deleteVariant = useDeleteProductVariant(productId);

  const [formModal, setFormModal] = useState<{ open: boolean; editing?: ProductVariant | null }>({ open: false });
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [groups, setGroups] = useState<UnitGroup[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    unitsApi.list().then((d) => setUnits(d.units)).catch(() => setUnits([]));
    unitsApi.groupList({ page: 1 }).then((d) => setGroups(d.groups)).catch(() => setGroups([]));
  }, []);

  const handleBulkAdd = async (items: BulkUnitItem[]) => {
    await productVariantsApi.bulkCreate(
      productId,
      items.map((i) => ({ unit_id: i.unit.id, price: parseFloat(i.price) || 0, stock_quantity: parseInt(i.stockQuantity || '0', 10) || 0 }))
    );
    queryClient.invalidateQueries({ queryKey: variantKeys.all(productId) });
  };

  const unitName = (unit?: ProductUnit | null): string => {
    if (!unit) return '';
    const lang: keyof ProductUnit = i18n.language === 'ar' ? 'nameAr' : i18n.language === 'he' ? 'nameHe' : i18n.language === 'ru' ? 'nameRu' : 'nameEn';
    return unit[lang] || unit.nameEn || unit.nameAr || unit.code;
  };

  if (isLoading) {
    return <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />;
  }

  const list = variants ?? [];
  const productNames: Partial<Record<'ar' | 'en' | 'he' | 'ru', string>> = {
    ar: productNameAr,
    en: productNameEn,
    he: productNameHe,
    ru: productNameRu,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-purple-600" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('products.variants.title', 'Variants')}</h3>
          {list.length > 0 && (
            <Badge variant="teal" size="sm">{list.length}</Badge>
          )}
        </div>
                <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setFormModal({ open: true })}>
            {t('products.variants.addVariant', 'Add Variant')}
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Layers2 size={14} />} onClick={() => setBulkOpen(true)}>
            {t('products.variants.addMultiple', 'Add multiple')}
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={t('products.variants.noVariants', 'No variants')}
          description={t('products.variants.addFirstUnit', 'Add your first variant (e.g. size, packaging)')}
        />
      ) : (
        <div className="space-y-2">
           {list.map((variant) => {
             const unit = units.find((u) => u.id === variant.unit_id);
             const variantColorLabel = variant.color
               ? (i18n.language === 'ar' ? variant.color.name_ar || variant.color.code : variant.color.name_en || variant.color.name_ar || variant.color.code)
               : null;
             const title = [
               variantColorLabel,
               unit ? unitName(unit) : null,
               !variantColorLabel && !unit ? variant.name_ar : null,
             ].filter(Boolean).join(' · ');
             return (
               <ListItem
                 key={variant.id}
                 icon={<Package size={14} className="text-brand-primary" />}
                 title={<span className="text-sm font-bold text-text-primary font-body">{title}</span>}
                badges={<>
                  {variant.is_active ? <Badge variant="green" size="sm">{t('common.active')}</Badge> : <Badge variant="red" size="sm">{t('common.inactive')}</Badge>}
                </>}
                actions={<>
                  <Button variant="secondary" size="sm" leftIcon={<Pencil size={12} />} onClick={() => setFormModal({ open: true, editing: variant })}>{t('common.edit')}</Button>
                  <Button variant={variant.is_active ? 'secondary' : 'primary'} size="sm" isLoading={toggleVariant.isPending} onClick={() => toggleVariant.mutate(variant.id)}>
                    {variant.is_active ? t('common.deactivate') : t('common.activate')}
                  </Button>
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} onClick={() => { if (confirm(t('products.variants.confirmDelete', 'Delete this variant?'))) deleteVariant.mutate(variant.id); }}>{t('common.delete')}</Button>
                </>}
              >
                <div className="flex items-center gap-4 text-xs text-text-secondary font-body flex-wrap">
                  <span className="flex items-center gap-1"><DollarSign size={12} />{variant.price}</span>
                  <span className="flex items-center gap-1"><Package size={12} />{t('products.variants.stock', 'Stock')}: {variant.stock_quantity} ({variant.available_stock} {t('products.variants.available', 'available')})</span>
                </div>
              </ListItem>
            );
          })}
        </div>
      )}

      <VariantFormModal
        key={formModal.editing?.id ?? 'create'}
        open={formModal.open}
        onClose={() => setFormModal({ open: false })}
        onSave={(data) => {
          if (formModal.editing) {
            updateVariant.mutate({ id: formModal.editing.id, data }, { onSuccess: () => setFormModal({ open: false }) });
          } else {
            createVariant.mutate(data, { onSuccess: () => setFormModal({ open: false }) });
          }
        }}
        isSaving={createVariant.isPending || updateVariant.isPending}
        editing={formModal.editing}
        units={units}
        colors={productColors}
        productNames={productNames}
        productSku={productSku ?? ''}
        existing={list}
      />

      <UnitMultiPickerModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        units={units}
        groups={groups}
        existingUnitIds={list.map((v) => v.unit_id).filter((v): v is number => v != null)}
        usedUnitIds={[]}
        onAdd={(items) => { void handleBulkAdd(items); }}
      />
    </div>
  );
}
