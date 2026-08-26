import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { useToastStore } from '@/stores/toastStore';
import { useColors } from '../hooks/useColors';
import { useProductSizes } from '../hooks/useProductSizes';
import { useProductColors, useDisableColorSize } from '../hooks/useProductColors';
import { useColorSizeVariants, useGenerateColorSizeVariants, useUpsertColorSizeVariants } from '../hooks/useColorSizeVariants';
import { ProductColorsSection } from './ProductColorsSection';
import { ProductColorSizeSelector } from './ProductColorSizeSelector';

interface ColorSizeManagementSectionProps {
  productId: number;
  basePrice: string;
  baseStock: string;
  onDisabled: () => void;
  onFinish?: () => void;
}

export function ColorSizeManagementSection({ productId, basePrice, baseStock, onDisabled, onFinish }: ColorSizeManagementSectionProps) {
  const { t } = useTranslation();
  const addToast = useToastStore((state) => state.addToast);
  const [disableOpen, setDisableOpen] = useState(false);
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [defaultPrice, setDefaultPrice] = useState(basePrice);
  const [defaultStock, setDefaultStock] = useState(baseStock);
  const [defaultActive, setDefaultActive] = useState(true);
  const globalColorsQuery = useColors({ page: 1, is_active: true, per_page: 100 });
  const sizesQuery = useProductSizes({ page: 1, is_active: true, per_page: 100 });
  const productColorsQuery = useProductColors(productId);
  const variantsQuery = useColorSizeVariants(productId);
  const generateMutation = useGenerateColorSizeVariants(productId);
  const disableMutation = useDisableColorSize(productId);
  const upsertMutation = useUpsertColorSizeVariants(productId);
  const [drafts, setDrafts] = useState<Record<number, { price: number; stockQuantity: number; isActive: boolean }>>({});

  const getRow = (variant: { id: number; price: number; stockQuantity: number; isActive: boolean }) => {
    const draft = drafts[variant.id];
    return {
      price: draft ? draft.price : variant.price,
      stockQuantity: draft ? draft.stockQuantity : variant.stockQuantity,
      isActive: draft ? draft.isActive : variant.isActive,
    };
  };

  const isDirty = Object.keys(drafts).length > 0;

  const saveMatrix = () => {
    const variants = variantsQuery.data ?? [];
    const rows = variants.map((variant) => {
      const row = getRow(variant);
      return {
        color_id: variant.colorId,
        size_id: variant.sizeId,
        price: row.price,
        stock_quantity: row.stockQuantity,
        is_active: row.isActive,
      };
    });
    upsertMutation.mutate(rows, { onSuccess: () => setDrafts({}) });
  };
  const productColors = productColorsQuery.data ?? [];
  const activeColors = productColors.filter((color) => color.isActive);
  const activeSizes = sizesQuery.data?.sizes.filter((size) => size.isActive) ?? [];
  const parsedPrice = Number(defaultPrice);
  const parsedStock = Number(defaultStock);
  const hasSelectedSizes = activeColors.some((color) => (selections[color.id] ?? []).length > 0);
  const canGenerate = activeColors.length > 0 && hasSelectedSizes && defaultPrice.trim() !== '' && defaultStock.trim() !== '' && Number.isFinite(parsedPrice) && parsedPrice >= 0 && Number.isInteger(parsedStock) && parsedStock >= 0;

  const generate = () => {
    const price = Number(defaultPrice);
    const stock = Number(defaultStock);
    const items = activeColors
      .map((color) => ({ color_id: color.id, size_ids: selections[color.id] ?? [] }))
      .filter((item) => item.size_ids.length > 0);
    if (activeColors.length === 0) {
      addToast('error', t('colorSize.validation.activeColorRequired'));
      return;
    }
    if (items.length === 0) {
      addToast('error', t('colorSize.validation.sizesRequired'));
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      addToast('error', t('colorSize.validation.invalidPrice'));
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      addToast('error', t('colorSize.validation.invalidStock'));
      return;
    }
    generateMutation.mutate({ items, price, stock_quantity: stock, is_active: defaultActive });
  };

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-teal-50 p-2.5 text-teal-600"><Layers3 size={20} /></span>
          <div><h3 className="font-bold text-text-primary">{t('colorSize.title')}</h3><p className="text-xs text-text-secondary mt-1">{t('colorSize.description')}</p></div>
        </div>
        <Button variant="danger" size="sm" onClick={() => setDisableOpen(true)}>{t('colorSize.disable')}</Button>
      </div>

      <div className="my-6 border-t border-border-default" />
      <ProductColorsSection
        productId={productId}
        colors={productColors}
        globalColors={globalColorsQuery.data?.colors ?? []}
        isLoading={productColorsQuery.isLoading}
      />

      <div className="my-6 border-t border-border-default" />
      {activeColors.length > 0 && activeSizes.length > 0 && (
        <ProductColorSizeSelector colors={activeColors} sizes={activeSizes} selections={selections} onChange={(colorId, sizeIds) => setSelections((current) => ({ ...current, [colorId]: sizeIds }))} />
      )}
      {activeColors.length > 0 && !sizesQuery.isLoading && activeSizes.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{t('colorSize.noActiveSizes')}</p>}

      <div className="my-6 border-t border-border-default" />
      <div className="space-y-4">
        <div><h4 className="text-sm font-bold text-text-primary">{t('colorSize.generateVariants')}</h4><p className="text-xs text-text-secondary mt-1">{t('colorSize.generateHint')}</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('colorSize.defaultPrice')} type="number" min="0" step="0.01" value={defaultPrice} onChange={(event) => setDefaultPrice(event.target.value)} />
          <Input label={t('colorSize.defaultStock')} type="number" min="0" step="1" value={defaultStock} onChange={(event) => setDefaultStock(event.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer"><input type="checkbox" checked={defaultActive} onChange={(event) => setDefaultActive(event.target.checked)} className="accent-brand-primary" />{t('colorSize.generatedActive')}</label>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" onClick={generate} isLoading={generateMutation.isPending} disabled={!canGenerate}>{t('colorSize.generateVariants')}</Button>
          {!variantsQuery.isLoading && <span className="text-sm text-text-secondary">{t('colorSize.generatedCount', { count: variantsQuery.data?.length ?? 0 })}</span>}
        </div>
        {(variantsQuery.data?.length ?? 0) > 0 && (
          <div className="rounded-xl border border-border-default overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
              <h5 className="text-sm font-bold text-text-primary">{t('colorSize.matrixTitle')}</h5>
              <Button variant="primary" size="sm" onClick={saveMatrix} isLoading={upsertMutation.isPending} disabled={!isDirty}>{t('colorSize.saveMatrix')}</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-secondary border-b border-border-default">
                    <th className="px-4 py-2 text-left font-body">{t('colorSize.columnColorSize')}</th>
                    <th className="px-4 py-2 text-left font-body">{t('colorSize.columnSku')}</th>
                    <th className="px-4 py-2 text-left font-body">{t('colorSize.columnPrice')}</th>
                    <th className="px-4 py-2 text-left font-body">{t('colorSize.columnStock')}</th>
                    <th className="px-4 py-2 text-left font-body">{t('colorSize.columnActive')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {variantsQuery.data?.map((variant) => {
                    const row = getRow(variant);
                    return (
                      <tr key={variant.id} className="font-body">
                        <td className="px-4 py-2 whitespace-nowrap">{variant.colorLabel || `#${variant.colorId}`} / {variant.sizeLabel || `#${variant.sizeId}`}</td>
                        <td className="px-4 py-2 font-mono whitespace-nowrap">{variant.sku || '—'}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.price}
                            onChange={(event) => setDrafts((current) => ({ ...current, [variant.id]: { ...getRow(variant), price: Number(event.target.value) } }))}
                            className="w-24 px-2 py-1 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.stockQuantity}
                            onChange={(event) => setDrafts((current) => ({ ...current, [variant.id]: { ...getRow(variant), stockQuantity: Number(event.target.value) } }))}
                            className="w-20 px-2 py-1 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={row.isActive}
                            onChange={(event) => setDrafts((current) => ({ ...current, [variant.id]: { ...getRow(variant), isActive: event.target.checked } }))}
                            className="accent-brand-primary"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {onFinish && (variantsQuery.data?.length ?? 0) > 0 && <Button variant="primary" size="sm" onClick={onFinish}>{t('createFlow.finish')}</Button>}
      </div>

      <ConfirmDialog
        open={disableOpen}
        title={t('colorSize.disableTitle')}
        message={t('colorSize.disableMessage')}
        confirmLabel={t('colorSize.disable')}
        cancelLabel={t('common.cancel')}
        isLoading={disableMutation.isPending}
        onCancel={() => setDisableOpen(false)}
        onConfirm={() => disableMutation.mutate(undefined, { onSuccess: () => { setDisableOpen(false); onDisabled(); } })}
      />
    </Card>
  );
}
