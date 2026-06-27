import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Region } from '../api/regionsApi';

interface ZoneFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name_ar: string; name_en?: string; code?: string }) => void;
  isSaving: boolean;
  editing?: Region | null;
}

export function ZoneForm({ open, onClose, onSave, isSaving, editing }: ZoneFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name_ar: '', name_en: '', code: '' });

  useEffect(() => {
    if (editing) {
      setForm({ name_ar: editing.nameAr || editing.name, name_en: editing.name === editing.nameAr ? '' : editing.name, code: '' });
    } else {
      setForm({ name_ar: '', name_en: '', code: '' });
    }
  }, [editing, open]);

  const handleSave = () => {
    onSave({
      name_ar: form.name_ar,
      ...(form.name_en ? { name_en: form.name_en } : {}),
      ...(form.code ? { code: form.code } : {}),
    });
  };

  return (
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
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave} disabled={!form.name_ar.trim()}>
            {editing ? t('common.save') : t('regions.zoneForm.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
