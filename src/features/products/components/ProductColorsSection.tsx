import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageOff, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import type { GlobalColor } from '../api/colorsApi';
import type { ProductColor } from '../api/productColorsApi';
import {
  useDeleteProductColor,
  useLinkProductColor,
  useToggleProductColor,
  useUpdateProductColor,
  useUploadProductColorImage,
} from '../hooks/useProductColors';
import { ProductColorLinkModal } from './ProductColorLinkModal';

interface ProductColorsSectionProps {
  productId: number;
  colors: ProductColor[];
  globalColors: GlobalColor[];
  isLoading: boolean;
}

export function ProductColorsSection({ productId, colors, globalColors, isLoading }: ProductColorsSectionProps) {
  const { t, i18n } = useTranslation();
  const [modal, setModal] = useState<{ open: boolean; color?: ProductColor }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<ProductColor | null>(null);
  const linkMutation = useLinkProductColor(productId);
  const updateMutation = useUpdateProductColor(productId);
  const imageMutation = useUploadProductColorImage(productId);
  const toggleMutation = useToggleProductColor(productId);
  const deleteMutation = useDeleteProductColor(productId);
  const linkedGlobalIds = new Set(colors.map((color) => color.globalColorId));
  const availableGlobalColors = globalColors.filter((color) => color.isActive && !linkedGlobalIds.has(color.id));
  const name = (color: ProductColor) => i18n.language === 'ar' ? color.nameAr || color.nameEn || color.code : color.nameEn || color.nameAr || color.code;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div><h4 className="text-sm font-bold text-text-primary">{t('colorSize.productColors')}</h4><p className="text-xs text-text-secondary mt-1">{t('colorSize.productColorsHint')}</p></div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setModal({ open: true })} disabled={availableGlobalColors.length === 0}>{t('colorSize.addColor')}</Button>
      </div>

      {!isLoading && colors.length === 0 ? (
        <EmptyState title={t('colorSize.noProductColors')} description={t('colorSize.noProductColorsHint')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {colors.map((color) => (
            <div key={color.id} className="rounded-xl border border-border-default p-4">
              <div className="flex gap-3">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-border-default bg-bg-input flex items-center justify-center">
                  {color.imageUrl ? <img src={color.imageUrl} alt={name(color) || ''} className="h-full w-full object-cover" /> : <ImageOff size={24} className="text-text-secondary/40" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="h-5 w-5 rounded border" style={{ backgroundColor: color.hex ?? 'transparent' }} /><p className="truncate font-bold text-text-primary">{name(color)}</p></div>
                  <p className="mt-1 font-mono text-xs text-text-secondary">{color.code} · {color.hex || '—'}</p>
                  <div className="mt-2"><Badge variant={color.isActive ? 'green' : 'red'} size="sm">{color.isActive ? t('common.active') : t('common.inactive')}</Badge></div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-section-alt">
                  <Upload size={12} /> {t('colorSize.changeImage')}
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => { const image = event.target.files?.[0]; if (image) imageMutation.mutate({ linkId: color.id, image }); event.target.value = ''; }} />
                </label>
                <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate(color.id)}>{color.isActive ? t('colorSize.disableColor') : t('colorSize.enableColor')}</Button>
                <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={() => setModal({ open: true, color })}>{t('common.edit')}</Button>
                <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} className="text-red-500" onClick={() => setDeleteTarget(color)}>{t('common.delete')}</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <ProductColorLinkModal
          open
          color={modal.color}
          globalColors={availableGlobalColors}
          isLoading={linkMutation.isPending || updateMutation.isPending}
          onClose={() => setModal({ open: false })}
          onCreate={(input) => linkMutation.mutate(input, { onSuccess: () => setModal({ open: false }) })}
          onUpdate={(input) => { if (modal.color) updateMutation.mutate({ linkId: modal.color.id, input }, { onSuccess: () => setModal({ open: false }) }); }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('colorSize.deleteColorTitle')}
        message={t('colorSize.deleteColorMessage', { name: deleteTarget ? name(deleteTarget) : '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }); }}
      />
    </div>
  );
}
