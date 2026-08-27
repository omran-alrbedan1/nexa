import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToastStore } from '@/stores/toastStore';
import { useProductColors } from '../hooks/useProductColors';
import { useColors } from '../hooks/useColors';
import {
  useProductVariants,
  useUpdateProductVariant,
  useDeleteProductVariant,
} from '../hooks/useProductVariants';
import { productVariantsApi, type ProductVariant } from '../api/productsApi';
import { unitsApi, type ProductUnit } from '../api/unitsApi';
import { extractErrorMessage } from '@/lib/apiHelpers';
import { ProductColorsSection } from './ProductColorsSection';

interface ProductVariantsSectionProps {
  productId: number;
  basePrice: string;
  baseStock: string;
  onFinish?: () => void;
}

interface VariantCombo {
  unit_id?: number | null;
  color_id?: number | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

export function ProductVariantsSection({ productId, basePrice, baseStock, onFinish }: ProductVariantsSectionProps) {
  const { t } = useTranslation();
  const addToast = useToastStore((state) => state.addToast);
  const [selectedColorIds, setSelectedColorIds] = useState<number[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
  const [defaultPrice, setDefaultPrice] = useState(basePrice);
  const [defaultStock, setDefaultStock] = useState(baseStock);
  const [defaultActive, setDefaultActive] = useState(true);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [generating, setGenerating] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, { price: number; stockQuantity: number; isActive: boolean }>>({});

  const productColorsQuery = useProductColors(productId);
  const globalColorsQuery = useColors({ page: 1, is_active: true, per_page: 100 });
  const variantsQuery = useProductVariants(productId);
  const updateVariant = useUpdateProductVariant(productId);
  const deleteVariant = useDeleteProductVariant(productId);

  const productColors = productColorsQuery.data ?? [];
  const activeColors = productColors.filter((color) => color.isActive);
  const variants = variantsQuery.data ?? [];

  useEffect(() => {
    unitsApi.list().then((response) => setUnits(response.units)).catch(() => setUnits([]));
  }, []);

  const getRow = (variant: ProductVariant) => {
    const draft = drafts[variant.id];
    return {
      price: draft ? draft.price : variant.price,
      stockQuantity: draft ? draft.stockQuantity : variant.stock_quantity,
      isActive: draft ? draft.isActive : variant.is_active,
    };
  };

  const toggleColor = (id: number) =>
    setSelectedColorIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const toggleUnit = (id: number) =>
    setSelectedUnitIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const generate = async () => {
    const price = Number(defaultPrice);
    const stock = Number(defaultStock);
    if (!Number.isFinite(price) || price < 0) {
      addToast('error', t('colorSize.validation.invalidPrice'));
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      addToast('error', t('colorSize.validation.invalidStock'));
      return;
    }
    if (selectedColorIds.length === 0 && selectedUnitIds.length === 0) {
      addToast('error', t('colorSize.validation.selectOne'));
      return;
    }

    const combos: VariantCombo[] = [];
    if (selectedColorIds.length > 0 && selectedUnitIds.length > 0) {
      for (const colorId of selectedColorIds) {
        for (const unitId of selectedUnitIds) {
          combos.push({ color_id: colorId, unit_id: unitId, price, stock_quantity: stock, is_active: defaultActive });
        }
      }
    } else if (selectedColorIds.length > 0) {
      for (const colorId of selectedColorIds) {
        combos.push({ color_id: colorId, unit_id: null, price, stock_quantity: stock, is_active: defaultActive });
      }
    } else {
      for (const unitId of selectedUnitIds) {
        combos.push({ unit_id: unitId, color_id: null, price, stock_quantity: stock, is_active: defaultActive });
      }
    }

    setGenerating(true);
    try {
      const result = await productVariantsApi.bulkCreate(
        productId,
        combos.map((combo) => ({
          color_id: combo.color_id ?? null,
          unit_id: combo.unit_id ?? null,
          price: combo.price,
          stock_quantity: combo.stock_quantity,
          is_active: combo.is_active,
        })),
      );
      setSelectedColorIds([]);
      setSelectedUnitIds([]);
      await variantsQuery.refetch();
      addToast('success', t('colorSize.generatedCount', { count: result.created.length }));
    } catch (error) {
      addToast('error', extractErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  };

  const updateCell = (variant: ProductVariant, patch: Partial<{ price: number; stockQuantity: number; isActive: boolean }>) => {
    setDrafts((current) => ({ ...current, [variant.id]: { ...getRow(variant), ...patch } }));
  };

  const saveRow = (variant: ProductVariant) => {
    const row = getRow(variant);
    updateVariant.mutate({
      id: variant.id,
      data: { price: row.price, stock_quantity: row.stockQuantity, is_active: row.isActive },
    });
    setDrafts((current) => {
      const next = { ...current };
      delete next[variant.id];
      return next;
    });
  };

  const isDirty = Object.keys(drafts).length > 0;

  return (
    <Card padding="lg">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-teal-50 p-2.5 text-teal-600"><Layers3 size={20} /></span>
        <div><h3 className="font-bold text-text-primary">{t('colorSize.title')}</h3><p className="text-xs text-text-secondary mt-1">{t('colorSize.description')}</p></div>
      </div>

      <div className="my-6 border-t border-border-default" />
      <ProductColorsSection
        productId={productId}
        colors={productColors}
        globalColors={globalColorsQuery.data?.colors ?? []}
        isLoading={productColorsQuery.isLoading}
      />

      <div className="my-6 border-t border-border-default" />
      <div className="space-y-4">
        <div><h4 className="text-sm font-bold text-text-primary">{t('colorSize.generateVariants')}</h4><p className="text-xs text-text-secondary mt-1">{t('colorSize.generateHint')}</p></div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold text-text-secondary">{t('colorSize.colors')}</p>
            {activeColors.length === 0 ? (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{t('colorSize.noActiveColors')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeColors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => toggleColor(color.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedColorIds.includes(color.id)
                        ? 'border-brand-primary bg-teal-50 text-brand-primary'
                        : 'border-border-default text-text-secondary hover:bg-bg-section-alt'
                    }`}
                  >
                    <span className="h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: color.hex ?? 'transparent' }} />
                    {color.nameAr || color.nameEn || color.code}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-text-secondary">{t('colorSize.units')}</p>
            {units.filter((unit) => unit.isActive).length === 0 ? (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{t('colorSize.noActiveUnits')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {units.filter((unit) => unit.isActive).map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => toggleUnit(unit.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedUnitIds.includes(unit.id)
                        ? 'border-brand-primary bg-teal-50 text-brand-primary'
                        : 'border-border-default text-text-secondary hover:bg-bg-section-alt'
                    }`}
                  >
                    {unit.nameAr}{unit.nameEn ? ` (${unit.nameEn})` : ''} — {unit.code}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('colorSize.defaultPrice')} type="number" min="0" step="0.01" value={defaultPrice} onChange={(event) => setDefaultPrice(event.target.value)} />
          <Input label={t('colorSize.defaultStock')} type="number" min="0" step="1" value={defaultStock} onChange={(event) => setDefaultStock(event.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" checked={defaultActive} onChange={(event) => setDefaultActive(event.target.checked)} className="accent-brand-primary" />
          {t('colorSize.generatedActive')}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" onClick={generate} isLoading={generating} disabled={generating}>
            {t('colorSize.generateVariants')}
          </Button>
          {!variantsQuery.isLoading && <span className="text-sm text-text-secondary">{t('colorSize.generatedCount', { count: variants.length })}</span>}
        </div>
      </div>

      {variants.length > 0 && (
        <>
          <div className="my-6 border-t border-border-default" />
          <div className="rounded-xl border border-border-default overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
              <h5 className="text-sm font-bold text-text-primary">{t('colorSize.matrixTitle')}</h5>
              <Button variant="primary" size="sm" onClick={() => variants.forEach((variant) => saveRow(variant))} isLoading={updateVariant.isPending} disabled={!isDirty}>{t('colorSize.saveMatrix')}</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-secondary border-b border-border-default">
                    <th className="px-4 py-2 text-left font-body">{t('colorSize.columnColorUnit')}</th>
                    <th className="px-4 py-2 text-left font-body">{t('colorSize.columnSku')}</th>
                    <th className="px-4 py-2 text-left font-body">{t('colorSize.columnPrice')}</th>
                    <th className="px-4 py-2 text-left font-body">{t('colorSize.columnStock')}</th>
                    <th className="px-4 py-2 text-left font-body">{t('colorSize.columnActive')}</th>
                    <th className="px-4 py-2 text-left font-body" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {variants.map((variant) => {
                    const row = getRow(variant);
                    const colorLabel = variant.color ? (variant.color.name_ar || variant.color.code || `#${variant.color_id}`) : t('colorSize.unitOnly');
                    const unitLabel = variant.unit ? (`${variant.unit.name_ar} (${variant.unit.code})`) : t('colorSize.colorOnly');
                    return (
                      <tr key={variant.id} className="font-body">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            {variant.color && <span className="h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: variant.color.hex ?? 'transparent' }} />}
                            {colorLabel} / {unitLabel}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-mono whitespace-nowrap">{variant.sku || '—'}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.price}
                            onChange={(event) => updateCell(variant, { price: Number(event.target.value) })}
                            className="w-24 px-2 py-1 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.stockQuantity}
                            onChange={(event) => updateCell(variant, { stockQuantity: Number(event.target.value) })}
                            className="w-20 px-2 py-1 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={row.isActive}
                            onChange={(event) => updateCell(variant, { isActive: event.target.checked })}
                            className="accent-brand-primary"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button type="button" onClick={() => deleteVariant.mutate(variant.id)} className="text-red-500 hover:text-red-700" aria-label={t('common.delete')}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {onFinish && <div className="mt-4 flex justify-end"><Button variant="primary" size="sm" onClick={onFinish}>{t('createFlow.finish')}</Button></div>}
        </>
      )}
    </Card>
  );
}
