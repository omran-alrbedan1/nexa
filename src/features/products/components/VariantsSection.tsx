import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListItem } from '@/components/ui/ListItem';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';
import { DollarSign, Package, Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { useProductVariants, useCreateProductVariant, useUpdateProductVariant, useToggleProductVariant, useDeleteProductVariant } from '../hooks/useProductVariants';
import type { ProductVariant, VariantFormData } from '../api/productsApi';

interface VariantsSectionProps {
  productId: number;
}

function VariantFormModal({
  open,
  onClose,
  onSave,
  isSaving,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: VariantFormData) => void;
  isSaving: boolean;
  editing?: ProductVariant | null;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<{ names: Partial<Record<TranslatedLang, string>>; sku: string; price: string; stock_quantity: string }>(() => ({
    names: { ar: editing?.name_ar ?? '', en: editing?.name_en ?? '', he: editing?.name_he ?? '', ru: editing?.name_ru ?? '' },
    sku: editing?.sku ?? '',
    price: editing ? String(editing.price) : '',
    stock_quantity: editing ? String(editing.stock_quantity) : '0',
  }));

  const handleSave = () => {
    onSave({
      name_ar: form.names.ar ?? '',
      ...(form.names.en ? { name_en: form.names.en } : {}),
      ...(form.names.he ? { name_he: form.names.he } : {}),
      ...(form.names.ru ? { name_ru: form.names.ru } : {}),
      ...(form.sku ? { sku: form.sku } : {}),
      price: parseFloat(form.price) || 0,
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('products.variants.editTitle', 'Edit Variant') : t('products.variants.createTitle', 'Create Variant')}
    >
      <div className="space-y-4">
        <TranslatedField
          label={t('products.variants.name', 'Name')}
          values={form.names}
          onChange={(key, value) => setForm({ ...form, names: { ...form.names, [key]: value } })}
          placeholder={t('products.variants.namePlaceholder', 'Variant name')}
          required
        />
        <div>
          <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('products.variants.sku', 'SKU')}</label>
          <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" placeholder="e.g. L-001" />
        </div>
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
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave} disabled={!form.names.ar?.trim() || !form.price}>
            {editing ? t('common.save') : t('products.variants.create', 'Create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function VariantsSection({ productId }: VariantsSectionProps) {
  const { t } = useTranslation();
  const { data: variants, isLoading } = useProductVariants(productId);
  const createVariant = useCreateProductVariant(productId);
  const updateVariant = useUpdateProductVariant(productId);
  const toggleVariant = useToggleProductVariant(productId);
  const deleteVariant = useDeleteProductVariant(productId);

  const [formModal, setFormModal] = useState<{ open: boolean; editing?: ProductVariant | null }>({ open: false });

  if (isLoading) {
    return <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />;
  }

  const list = variants ?? [];

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
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setFormModal({ open: true })}>
          {t('products.variants.addVariant', 'Add Variant')}
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={t('products.variants.noVariants', 'No variants')}
          description={t('products.variants.addFirst', 'Add your first variant (e.g. size, color)')}
        />
      ) : (
        <div className="space-y-2">
          {list.map((variant) => (
            <ListItem
              key={variant.id}
              icon={<Package size={14} className="text-brand-primary" />}
              title={<span className="text-sm font-bold text-text-primary font-body">{variant.name_ar}{variant.name_en ? ` (${variant.name_en})` : ''}</span>}
              badges={<>
                {variant.is_active ? <Badge variant="green" size="sm">{t('common.active')}</Badge> : <Badge variant="red" size="sm">{t('common.inactive')}</Badge>}
                {variant.sku && <span className="text-xs text-text-tertiary">{variant.sku}</span>}
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
          ))}
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
      />
    </div>
  );
}
