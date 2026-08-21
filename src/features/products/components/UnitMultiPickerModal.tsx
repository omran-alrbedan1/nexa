import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, Layers2, Package, CheckSquare, Square } from 'lucide-react';
import type { ProductUnit, UnitGroup } from '../api/unitsApi';

export interface BulkUnitItem {
  unit: ProductUnit;
  price: string;
  stockQuantity: string;
}

interface UnitMultiPickerModalProps {
  open: boolean;
  onClose: () => void;
  units: ProductUnit[];
  groups: UnitGroup[];
  existingUnitIds: number[];
  usedUnitIds: number[];
  onAdd: (items: BulkUnitItem[]) => void;
}

const unitLabel = (unit: ProductUnit, lang: string): string => {
  const key = lang === 'ar' ? 'nameAr' : lang === 'he' ? 'nameHe' : lang === 'ru' ? 'nameRu' : 'nameEn';
  return (unit[key] as string | null) || unit.nameEn || unit.nameAr || unit.code;
};

export function UnitMultiPickerModal({ open, onClose, units, groups, existingUnitIds, usedUnitIds, onAdd }: UnitMultiPickerModalProps) {
  const { t, i18n } = useTranslation();
  const [groupFilter, setGroupFilter] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [stocks, setStocks] = useState<Record<number, string>>({});
  const [samePrice, setSamePrice] = useState('');

  const isTaken = (id: number) => existingUnitIds.includes(id) || usedUnitIds.includes(id);

  const visibleUnits = useMemo(() => {
    const q = search.trim().toLowerCase();
    return units.filter((u) => {
      if (isTaken(u.id)) return false;
      if (groupFilter !== '') {
        const inGroup = (u.groups ?? []).some((g) => g.id === groupFilter) || (u.groupIds ?? []).includes(groupFilter);
        if (!inGroup) return false;
      }
      if (!q) return true;
      return [u.code, u.nameAr, u.nameEn, u.nameHe, u.nameRu].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [units, groupFilter, search, existingUnitIds, usedUnitIds]);

  const selectedCount = selected.size;
  const allVisibleSelected = visibleUnits.length > 0 && visibleUnits.every((u) => selected.has(u.id));

  const unitGroupIds = (u: ProductUnit): number[] =>
    (u.groupIds ?? []).concat((u.groups ?? []).map((g) => g.id)).filter((id, i, arr) => arr.indexOf(id) === i);

  const groupName = (id: number): string => {
    const g = groups.find((x) => x.id === id);
    return g ? (g.nameAr || g.nameEn || g.code) : String(id);
  };

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (samePrice) setPrices((p) => ({ ...p, [id]: samePrice }));
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleUnits.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleUnits.forEach((u) => next.add(u.id));
        return next;
      });
      if (samePrice) {
        setPrices((prev) => {
          const next = { ...prev };
          visibleUnits.forEach((u) => { next[u.id] = samePrice; });
          return next;
        });
      }
    }
  };

  const applySamePrice = () => {
    if (!samePrice || selectedCount === 0) return;
    setPrices((prev) => {
      const next = { ...prev };
      visibleUnits.forEach((u) => { if (selected.has(u.id)) next[u.id] = samePrice; });
      return next;
    });
  };

  const clearSelection = () => {
    setSelected(new Set());
    setPrices({});
    setStocks({});
  };

  const handleAdd = () => {
    const items: BulkUnitItem[] = units
      .filter((u) => selected.has(u.id) && !isTaken(u.id))
      .map((u) => ({ unit: u, price: prices[u.id] ?? '', stockQuantity: stocks[u.id] ?? '0' }));
    if (items.length === 0) return;
    onAdd(items);
    setSelected(new Set());
    setPrices({});
    setStocks({});
    setSamePrice('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('products.variants.bulkTitle', 'Add multiple units')} size="lg">
      <div className="space-y-4">
        {/* Group filter + search */}
        <div className="flex items-center gap-2 flex-wrap">
          <Layers2 size={16} className="text-brand-primary shrink-0" />
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value ? Number(e.target.value) : '')}
            className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
          >
            <option value="">{t('products.variants.allGroups', 'All groups')}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.nameAr || g.nameEn || g.code}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('products.variants.searchUnits', 'Search units…')}
              className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        {/* Same price / shortcuts */}
        {(selectedCount > 0 || samePrice) && (
          <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-bg-section-alt border border-border-default/60">
            <span className="text-xs font-bold text-text-secondary font-body">
              {samePrice
                ? t('products.variants.priceForAll', 'Price {{price}} will apply to all selected', { price: samePrice })
                : t('products.variants.applyToSelected', 'Apply to {{count}} selected', { count: selectedCount })}:
            </span>
            <input
              type="number" min="0" step="0.01" value={samePrice}
              onChange={(e) => setSamePrice(e.target.value)}
              placeholder={t('products.variants.samePrice', 'Same price')}
              className="w-32 px-2.5 py-1.5 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
            <Button variant="secondary" size="sm" onClick={applySamePrice} disabled={!samePrice || selectedCount === 0}>{t('products.variants.apply', 'Apply')}</Button>
            <Button variant="ghost" size="sm" onClick={clearSelection} disabled={selectedCount === 0}>{t('products.variants.clear', 'Clear')}</Button>
          </div>
        )}

        {/* List header */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={visibleUnits.length === 0}
            className="flex items-center gap-2 text-xs font-bold text-text-secondary font-body hover:text-brand-primary disabled:opacity-40"
          >
            {allVisibleSelected ? <CheckSquare size={14} /> : <Square size={14} />}
            {allVisibleSelected ? t('products.variants.deselectAll', 'Deselect all') : t('products.variants.selectAll', 'Select all')} ({visibleUnits.length})
          </button>
          <span className="text-xs text-text-tertiary font-body">
            {groupFilter !== '' ? `${groupName(groupFilter)} · ` : ''}{visibleUnits.length} {t('products.variants.units', 'units')}
          </span>
        </div>

        {/* Unit list */}
        <div className="max-h-64 overflow-y-auto border border-border-default rounded-xl divide-y divide-border-default/50">
          {visibleUnits.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-tertiary font-body">{t('products.variants.noUnitsInGroup', 'No units match this filter')}</div>
          ) : (
            visibleUnits.map((unit) => {
              const checked = selected.has(unit.id);
              const ugids = unitGroupIds(unit);
              return (
                <label key={unit.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-brand-primary-light/40' : 'hover:bg-bg-section-alt'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(unit.id)}
                    className="w-4 h-4 accent-brand-primary flex-shrink-0"
                  />
                  <Package size={14} className="text-brand-primary shrink-0" />
                  <span className="text-sm font-bold text-text-primary font-body flex-1 min-w-0 truncate">{unitLabel(unit, i18n.language)}</span>
                  {ugids.length > 0 && (
                    <span className="hidden sm:flex items-center gap-1 shrink-0">
                      {ugids.map((gid) => (
                        <Badge key={gid} variant="purple" size="sm">{groupName(gid)}</Badge>
                      ))}
                    </span>
                  )}
                  <Badge variant="gray" size="sm">{unit.code}</Badge>
                  {checked && (
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number" min="0" step="0.01"
                        value={prices[unit.id] ?? ''}
                        onChange={(e) => setPrices({ ...prices, [unit.id]: e.target.value })}
                        placeholder={t('products.variants.price', 'Price')}
                        className="w-24 px-2 py-1 text-xs border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
                      />
                      <input
                        type="number" min="0"
                        value={stocks[unit.id] ?? '0'}
                        onChange={(e) => setStocks({ ...stocks, [unit.id]: e.target.value })}
                        placeholder={t('products.variants.stock', 'Stock')}
                        className="w-20 px-2 py-1 text-xs border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
                      />
                    </div>
                  )}
                </label>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" onClick={handleAdd} disabled={selectedCount === 0}>
            {t('products.variants.addSelected', 'Add {{count}} units', { count: selectedCount })}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
