import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Map, MapPin } from 'lucide-react';
import type { Region } from '../api/regionsApi';
import { PolygonEditor } from './PolygonEditor';

interface ZoneFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name_ar: string; name_en?: string; code?: string; boundaries?: { lat: number; lng: number }[][] }) => void;
  isSaving: boolean;
  editing?: Region | null;
}

export function ZoneForm({ open, onClose, onSave, isSaving, editing }: ZoneFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name_ar: '', name_en: '', code: '' });
  const [boundaries, setBoundaries] = useState<{ lat: number; lng: number }[][] | null>(null);
  const [showBoundaryEditor, setShowBoundaryEditor] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({ name_ar: editing.nameAr || editing.name, name_en: editing.name === editing.nameAr ? '' : editing.name, code: '' });
      setBoundaries(editing.boundaries ?? null);
    } else {
      setForm({ name_ar: '', name_en: '', code: '' });
      setBoundaries(null);
    }
  }, [editing, open]);

  const handleSave = () => {
    const data: { name_ar: string; name_en?: string; code?: string; boundaries?: { lat: number; lng: number }[][] } = {
      name_ar: form.name_ar,
      ...(form.name_en ? { name_en: form.name_en } : {}),
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
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.zoneForm.nameAr')}</label>
            <input
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.zoneForm.nameEn')}</label>
            <input
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.zoneForm.code')}</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              placeholder="e.g. RUH-01"
            />
          </div>

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
            <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave} disabled={!form.name_ar.trim()}>
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
