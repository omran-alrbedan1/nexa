import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';

interface CountryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name_ar: string; name_en?: string; name_he?: string; name_ru?: string; code: string; dial_code?: string; is_active?: boolean }) => void;
  isSaving: boolean;
  editing?: { name_ar: string; name_en: string | null; name_he: string | null; name_ru: string | null; code: string; dial_code: string | null; is_active: boolean } | null;
}

export function CountryForm({ open, onClose, onSave, isSaving, editing }: CountryFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ names: {} as Partial<Record<TranslatedLang, string>>, code: '', dial_code: '', is_active: true });

  useEffect(() => {
    if (editing) {
      setForm({
        names: { ar: editing.name_ar, en: editing.name_en || '', he: editing.name_he || '', ru: editing.name_ru || '' },
        code: editing.code,
        dial_code: editing.dial_code || '',
        is_active: editing.is_active,
      });
    } else {
      setForm({ names: {}, code: '', dial_code: '', is_active: true });
    }
  }, [editing, open]);

  const handleSave = () => {
    onSave({
      name_ar: form.names.ar ?? '',
      ...(form.names.en ? { name_en: form.names.en } : {}),
      ...(form.names.he ? { name_he: form.names.he } : {}),
      ...(form.names.ru ? { name_ru: form.names.ru } : {}),
      code: form.code.toUpperCase(),
      ...(form.dial_code ? { dial_code: form.dial_code } : {}),
      is_active: form.is_active,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('locations.countries.form.editTitle') : t('locations.countries.form.createTitle')}
    >
      <div className="space-y-4">
        <TranslatedField
          label={t('locations.countries.form.nameAr')}
          values={form.names}
          onChange={(key, value) => setForm({ ...form, names: { ...form.names, [key]: value } })}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.countries.form.code')} *</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary font-mono uppercase"
              placeholder="SA"
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.countries.form.dialCode')}</label>
            <input
              value={form.dial_code}
              onChange={(e) => setForm({ ...form, dial_code: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              placeholder="966"
            />
          </div>
        </div>
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
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave} disabled={!form.names.ar?.trim() || !form.code.trim()}>
            {editing ? t('common.save') : t('locations.countries.form.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
