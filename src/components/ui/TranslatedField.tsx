import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type TranslatedLang = 'ar' | 'en' | 'he' | 'ru';

const LANG_DIR: Record<TranslatedLang, string> = {
  ar: 'rtl',
  en: 'ltr',
  he: 'rtl',
  ru: 'ltr',
};

interface LangTabsProps {
  value: TranslatedLang;
  onChange: (lang: TranslatedLang) => void;
  className?: string;
}

const LANGS: TranslatedLang[] = ['ar', 'en', 'he', 'ru'];

export function LangTabs({ value, onChange, className }: LangTabsProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex items-center gap-1 p-1 bg-bg-section-alt rounded-xl w-fit', className)}>
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all uppercase',
            value === lang
              ? 'bg-white text-brand-accent shadow-sm font-bold'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          {t(`langs.${lang}`, lang.toUpperCase())}
        </button>
      ))}
    </div>
  );
}

interface TranslatedFieldProps {
  label: string;
  values: Partial<Record<TranslatedLang, string>>;
  onChange: (key: TranslatedLang, value: string) => void;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  hint?: string;
}

export function TranslatedField({
  label,
  values,
  onChange,
  placeholder,
  required,
  textarea,
  hint,
}: TranslatedFieldProps) {
  const [lang, setLang] = useState<TranslatedLang>('ar');
  const inputClass =
    'w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="block text-xs font-bold text-text-secondary font-body">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        <LangTabs value={lang} onChange={setLang} />
      </div>
      {textarea ? (
        <textarea
          value={values[lang] ?? ''}
          onChange={(e) => onChange(lang, e.target.value)}
          placeholder={placeholder}
          dir={LANG_DIR[lang]}
          className={cn(inputClass, 'min-h-24 resize-y')}
        />
      ) : (
        <input
          value={values[lang] ?? ''}
          onChange={(e) => onChange(lang, e.target.value)}
          placeholder={placeholder}
          dir={LANG_DIR[lang]}
          className={inputClass}
        />
      )}
      {hint && <p className="text-xs text-text-tertiary font-body">{hint}</p>}
    </div>
  );
}
