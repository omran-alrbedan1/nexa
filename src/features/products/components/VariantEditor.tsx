import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';
import { Package, Plus, Pencil, Trash2, Layers } from 'lucide-react';

export interface VariantDraft {
  id?: number;
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
}

export function VariantEditor({ value, onChange }: VariantEditorProps) {
  const { t } = useTranslation();
  const [modal, setModal] = useState<{ open: boolean; index?: number }>({ open: false });
  const [draft, setDraft] = useState<{ names: Partial<Record<TranslatedLang, string>>; sku: string; price: string; stock_quantity: string; is_active: boolean }>({
    names: {}, sku: '', price: '', stock_quantity: '0', is_active: true,
  });

  const openCreate = () => {
    setDraft({ names: {}, sku: '', price: '', stock_quantity: '0', is_active: true });
    setModal({ open: true });
  };

  const openEdit = (index: number) => {
    const v = value[index];
    setDraft({
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
      name_ar: draft.names.ar ?? '',
      ...(draft.names.en ? { name_en: draft.names.en } : {}),
      ...(draft.names.he ? { name_he: draft.names.he } : {}),
      ...(draft.names.ru ? { name_ru: draft.names.ru } : {}),
      ...(draft.sku ? { sku: draft.sku } : {}),
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-purple-600" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('products.variants.title', 'Variants')}</h3>
          {value.length > 0 && <Badge variant="teal" size="sm">{value.length}</Badge>}
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          {t('products.variants.addVariant', 'Add Variant')}
        </Button>
      </div>

      {value.length === 0 ? (
        <EmptyState
          title={t('products.variants.noVariants', 'No variants')}
          description={t('products.variants.addFirst', 'Add your first variant (e.g. size, color)')}
        />
      ) : (
        <div className="space-y-2">
          {value.map((variant, index) => (
            <div
              key={variant.id ?? `new-${index}`}
              className="flex items-center justify-between gap-3 p-3 border border-border-default rounded-xl bg-bg-card"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Package size={14} className="text-brand-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary font-body truncate">
                    {variant.name_ar}{variant.name_en ? ` (${variant.name_en})` : ''}
                  </p>
                  <p className="text-xs text-text-secondary font-body">
                    {variant.price} · {t('products.variants.stock', 'Stock')}: {variant.stock_quantity}
                    {variant.sku ? ` · ${variant.sku}` : ''}
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
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.index != null ? t('products.variants.editTitle', 'Edit Variant') : t('products.variants.createTitle', 'Create Variant')}
      >
        <div className="space-y-4">
          <TranslatedField
            label={t('products.variants.name', 'Name')}
            values={draft.names}
            onChange={(key, val) => setDraft({ ...draft, names: { ...draft.names, [key]: val } })}
            placeholder={t('products.variants.namePlaceholder', 'Variant name')}
            required
          />
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('products.variants.sku', 'SKU')}</label>
            <input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" placeholder="e.g. L-001" />
          </div>
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
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!draft.names.ar?.trim() || !draft.price}>
              {modal.index != null ? t('common.save') : t('products.variants.create', 'Create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
