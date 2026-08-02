import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';

interface ProvinceFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name_ar: string; name_en?: string; name_he?: string; name_ru?: string; is_active?: boolean }) => void;
  isSaving: boolean;
  countryCode?: string;
  editing?: { name_ar: string; name_en: string | null; name_he: string | null; name_ru: string | null; is_active: boolean } | null;
}

export function ProvinceForm({ open, onClose, onSave, isSaving, countryCode, editing }: ProvinceFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ names: {} as Partial<Record<TranslatedLang, string>>, is_active: true });

  useEffect(() => {
    if (editing) {
      setForm({
        names: { ar: editing.name_ar, en: editing.name_en || '', he: editing.name_he || '', ru: editing.name_ru || '' },
        is_active: editing.is_active,
      });
    } else {
      setForm({ names: {}, is_active: true });
    }
  }, [editing, open]);

  const handleSave = () => {
    onSave({
      name_ar: form.names.ar ?? '',
      ...(form.names.en ? { name_en: form.names.en } : {}),
      ...(form.names.he ? { name_he: form.names.he } : {}),
      ...(form.names.ru ? { name_ru: form.names.ru } : {}),
      is_active: form.is_active,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('locations.provinces.form.editTitle') : t('locations.provinces.form.createTitle')}
    >
      <div className="space-y-4">
        {countryCode && (
          <div className="text-xs text-text-tertiary bg-bg-section-alt rounded-lg px-3 py-2">
            {t('locations.provinces.form.country')}: <span className="font-bold uppercase">{countryCode}</span>
          </div>
        )}
        <TranslatedField
          label={t('locations.provinces.form.nameAr')}
          values={form.names}
          onChange={(key, value) => setForm({ ...form, names: { ...form.names, [key]: value } })}
          required
        />
        <div className="flex items-center gap-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-border-default text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm font-bold text-text-primary font-body">{t('common.active')}</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave} disabled={!form.names.ar?.trim()}>
            {editing ? t('common.save') : t('locations.provinces.form.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
