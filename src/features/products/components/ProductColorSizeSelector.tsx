import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import type { ProductColor } from '../api/productColorsApi';
import type { ProductSize } from '../api/productSizesApi';

interface ProductColorSizeSelectorProps {
  colors: ProductColor[];
  sizes: ProductSize[];
  selections: Record<number, number[]>;
  onChange: (colorId: number, sizeIds: number[]) => void;
}

export function ProductColorSizeSelector({ colors, sizes, selections, onChange }: ProductColorSizeSelectorProps) {
  const { t, i18n } = useTranslation();
  const colorName = (color: ProductColor) => i18n.language === 'ar' ? color.nameAr || color.nameEn || color.code : color.nameEn || color.nameAr || color.code;
  const sizeName = (size: ProductSize) => i18n.language === 'ar' ? size.nameAr : size.nameEn || size.nameAr;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-text-primary">{t('colorSize.selectSizes')}</h4>
        <p className="text-xs text-text-secondary mt-1">{t('colorSize.selectSizesHint')}</p>
      </div>
      {colors.map((color) => {
        const selected = selections[color.id] ?? [];
        return (
          <div key={color.id} className="rounded-xl border border-border-default p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-6 w-6 rounded-md border border-border-default" style={{ backgroundColor: color.hex ?? 'transparent' }} />
              <span className="font-bold text-sm text-text-primary">{colorName(color)}</span>
              <span className="font-mono text-xs text-text-secondary">{color.code}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const checked = selected.includes(size.id);
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => onChange(color.id, checked ? selected.filter((id) => id !== size.id) : [...selected, size.id])}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
                      checked ? 'border-brand-primary bg-brand-primary text-white' : 'border-border-default bg-white text-text-secondary hover:border-brand-primary'
                    )}
                    aria-pressed={checked}
                  >
                    {checked ? '✓ ' : ''}{size.code} · {sizeName(size)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
