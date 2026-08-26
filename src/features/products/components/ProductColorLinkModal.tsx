import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { GlobalColor } from '../api/colorsApi';
import type { ProductColor } from '../api/productColorsApi';

interface ProductColorLinkModalProps {
  open: boolean;
  color?: ProductColor;
  globalColors: GlobalColor[];
  isLoading: boolean;
  onClose: () => void;
  onCreate: (input: { globalColorId: number; image?: File; sortOrder: number; isActive: boolean }) => void;
  onUpdate: (input: { sortOrder: number; isActive: boolean }) => void;
}

export function ProductColorLinkModal({
  open,
  color,
  globalColors,
  isLoading,
  onClose,
  onCreate,
  onUpdate,
}: ProductColorLinkModalProps) {
  const { t, i18n } = useTranslation();
  const [globalColorId, setGlobalColorId] = useState(color ? String(color.globalColorId) : String(globalColors[0]?.id ?? ''));
  const [sortOrder, setSortOrder] = useState(String(color?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(color?.isActive ?? true);
  const [image, setImage] = useState<File | undefined>();
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setImage(undefined);
    setGlobalColorId('');
    setSortOrder('0');
    setIsActive(true);
  };

  const close = () => {
    reset();
    onClose();
  };

  const selectedGlobalColor = globalColors.find((item) => String(item.id) === globalColorId);
  const localizedName = (item: GlobalColor) => i18n.language === 'ar' ? item.nameAr : item.nameEn || item.nameAr;

  const save = () => {
    if (color) {
      onUpdate({ sortOrder: Number.parseInt(sortOrder || String(color.sortOrder), 10) || 0, isActive });
      return;
    }
    const parsedId = Number.parseInt(globalColorId, 10);
    if (!parsedId) return;
    onCreate({ globalColorId: parsedId, image, sortOrder: Number.parseInt(sortOrder, 10) || 0, isActive });
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={color ? t('colorSize.editColor') : t('colorSize.addColor')}
    >
      <div className="space-y-4">
        {color ? (
          <div className="flex items-center gap-3 rounded-xl border border-border-default p-3">
            <span className="h-8 w-8 rounded-lg border border-border-default" style={{ backgroundColor: color.hex ?? 'transparent' }} />
            <div><p className="font-bold text-text-primary">{color.nameEn || color.nameAr || color.code}</p><p className="text-xs font-mono text-text-secondary">{color.code}</p></div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('colorSize.globalColor')}</label>
            <select
              value={globalColorId}
              onChange={(event) => setGlobalColorId(event.target.value)}
              className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
            >
              <option value="">{t('colorSize.selectGlobalColor')}</option>
              {globalColors.map((item) => <option key={item.id} value={item.id}>{localizedName(item)} — {item.code} ({item.hex || '—'})</option>)}
            </select>
            {selectedGlobalColor && <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary"><span className="h-5 w-5 rounded border" style={{ backgroundColor: selectedGlobalColor.hex ?? 'transparent' }} />{selectedGlobalColor.hex || t('colors.noHex')}</div>}
          </div>
        )}

        {!color && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('colorSize.productImage')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (preview) URL.revokeObjectURL(preview);
                setImage(file);
                setPreview(URL.createObjectURL(file));
              }}
              className="block w-full text-sm text-text-secondary"
            />
            {preview && <img src={preview} alt={t('colorSize.imagePreview')} className="mt-3 h-28 w-28 rounded-xl border border-border-default object-cover" />}
          </div>
        )}

        <Input label={t('colorSize.sortOrder')} type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-brand-primary" />
          {t('common.active')}
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={close}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" onClick={save} isLoading={isLoading} disabled={!color && !globalColorId}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  );
}
