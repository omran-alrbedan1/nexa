import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';
import { Languages, Check, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'ru', label: 'Русский', dir: 'ltr' },
  { code: 'he', label: 'עברית', dir: 'rtl' },
] as const;

export function LanguageSwitch() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  // Apply dir and lang attributes to <html>
  useEffect(() => {
    const lang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];
    document.documentElement.dir = lang.dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('nexa-lang', code);
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary rounded-md transition-colors"
        title="Language"
      >
        <Languages size={14} />
        <span className="uppercase tracking-wider">{currentLang.code}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-border-default shadow-lg z-50 py-1 animate-fade-up">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-body transition-colors hover:bg-bg-section-alt
                ${lang.code === i18n.language ? 'text-brand-primary font-bold' : 'text-text-primary'}
              `}
            >
              <span className="flex-1 text-left">{lang.label}</span>
              {lang.code === i18n.language && (
                <Check size={14} className="text-brand-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
