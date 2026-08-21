import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Map, MapPin } from 'lucide-react';
import type { Region } from '../api/regionsApi';
import { provincesApi } from '@/features/locations/api/provincesApi';
import { PolygonEditor } from './PolygonEditor';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';

interface ZoneFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { province_id: number; name_ar: string; name_en?: string; name_he?: string; name_ru?: string; code?: string; boundaries?: { lat: number; lng: number }[][] }) => void;
  isSaving: boolean;
  editing?: Region | null;
}

export function ZoneForm({ open, onClose, onSave, isSaving, editing }: ZoneFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<{ province_id: number; names: Partial<Record<TranslatedLang, string>>; code: string }>({ province_id: 0, names: {}, code: '' });
  const [boundaries, setBoundaries] = useState<{ lat: number; lng: number }[][] | null>(null);
  const [showBoundaryEditor, setShowBoundaryEditor] = useState(false);

  const { data: provincesData } = useQuery({
    queryKey: ['provinces-for-zone-form'],
    queryFn: () => provincesApi.getAll({ perPage: 200 }),
    staleTime: 60_000,
  });
  const provinces = provincesData?.data ?? [];

  useEffect(() => {
    if (editing) {
      setForm({
        province_id: editing.provinceId ?? 0,
        names: { ar: editing.nameAr || editing.name, en: editing.nameEn || '', he: editing.nameHe || '', ru: editing.nameRu || '' },
        code: editing.code ?? '',
      });
      setBoundaries(editing.boundaries ?? null);
    } else {
      setForm({ province_id: 0, names: {}, code: '' });
      setBoundaries(null);
    }
  }, [editing, open]);

  const handleSave = () => {
    const data: { province_id: number; name_ar: string; name_en?: string; name_he?: string; name_ru?: string; code?: string; boundaries?: { lat: number; lng: number }[][] } = {
      province_id: form.province_id ?? 0,
      name_ar: form.names.ar ?? '',
      ...(form.names.en ? { name_en: form.names.en } : {}),
      ...(form.names.he ? { name_he: form.names.he } : {}),
      ...(form.names.ru ? { name_ru: form.names.ru } : {}),
      ...(form.code ? { code: form.code } : {}),
    };
    if (boundaries && boundaries.length > 0) {
      data.boundaries = boundaries;
    }
    onSave(data);
  };

  const boundaryCount = boundaries && boundaries.length > 0 ? boundaries[0].length : 0;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={editing ? t('regions.zoneForm.editTitle') : t('regions.zoneForm.createTitle')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.zoneForm.province')} *</label>
              <select
                value={form.province_id}
                onChange={(e) => setForm({ ...form, province_id: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              >
                <option value={0} disabled>{t('regions.zoneForm.selectProvince')}</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name_ar}{p.name_en ? ` (${p.name_en})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.zoneForm.code')}{!editing && ' *'}</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
                placeholder={t('regions.zoneForm.codePlaceholder', 'e.g. RUH-01')}
              />
              {!editing && !form.code.trim() && (
                <p className="text-xs text-status-error mt-1 font-body">{t('regions.zoneForm.codeRequired', 'Zone code is required (e.g. RUH-01)')}</p>
              )}
            </div>
          </div>
          <TranslatedField
            label={t('regions.zoneForm.nameAr')}
            values={form.names}
            onChange={(key, value) => setForm({ ...form, names: { ...form.names, [key]: value } })}
            required
          />

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.zoneForm.boundary', 'Zone Boundary')}</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowBoundaryEditor(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input hover:bg-gray-50 transition-colors outline-none focus:border-brand-primary"
              >
                <Map size={16} className="text-purple-600" />
                {boundaryCount > 0
                  ? t('regions.zoneForm.pointsCount', '{{count}} points', { count: boundaryCount })
                  : t('regions.zoneForm.drawBoundary', 'Draw Boundary')}
              </button>
              {boundaryCount > 0 && (
                <>
                  <Badge variant="teal" size="sm">
                    <MapPin size={10} className="mr-1" />
                    {boundaryCount}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setBoundaries(null)}
                    className="text-xs text-status-error hover:underline"
                  >
                    {t('common.remove', 'Remove')}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave}
              disabled={!form.names.ar?.trim() || form.province_id === 0 || (!editing && !form.code.trim()) || (boundaryCount > 0 && boundaryCount < 3)}>
              {editing ? t('common.save') : t('regions.zoneForm.create')}
            </Button>
          </div>
        </div>
      </Modal>

      <PolygonEditor
        open={showBoundaryEditor}
        onClose={() => setShowBoundaryEditor(false)}
        onSave={(b) => setBoundaries(b)}
        initialBoundaries={boundaries}
      />
    </>
  );
}
