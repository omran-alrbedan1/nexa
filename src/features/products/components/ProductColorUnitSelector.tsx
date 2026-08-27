import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import type { ProductColor } from '../api/productColorsApi';
import type { ProductUnit } from '../api/unitsApi';

interface ProductColorUnitSelectorProps {
  colors: ProductColor[];
  units: ProductUnit[];
  selections: Record<number, number[]>;
  onChange: (colorId: number, unitIds: number[]) => void;
}

export function ProductColorUnitSelector({ colors, units, selections, onChange }: ProductColorUnitSelectorProps) {
  const { t, i18n } = useTranslation();
  const colorName = (color: ProductColor) => i18n.language === 'ar' ? color.nameAr || color.nameEn || color.code : color.nameEn || color.nameAr || color.code;
  const unitName = (unit: ProductUnit) => {
    const lang: keyof ProductUnit = i18n.language === 'ar' ? 'nameAr' : i18n.language === 'he' ? 'nameHe' : i18n.language === 'ru' ? 'nameRu' : 'nameEn';
    return unit[lang] || unit.nameEn || unit.nameAr || unit.code;
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-text-primary">{t('colorSize.selectUnits')}</h4>
        <p className="text-xs text-text-secondary mt-1">{t('colorSize.selectUnitsHint')}</p>
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
              {units.map((unit) => {
                const checked = selected.includes(unit.id);
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => onChange(color.id, checked ? selected.filter((id) => id !== unit.id) : [...selected, unit.id])}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
                      checked ? 'border-brand-primary bg-brand-primary text-white' : 'border-border-default bg-white text-text-secondary hover:border-brand-primary'
                    )}
                    aria-pressed={checked}
                  >
                    {checked ? '✓ ' : ''}{unit.code} · {unitName(unit)}
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
