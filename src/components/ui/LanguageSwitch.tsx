import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function LanguageSwitch() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const toggleLanguage = () => {
    const newLang = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('nexa-lang', newLang);
  };

  // Apply dir and lang attributes to <html>
  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <button
      onClick={toggleLanguage}
      className="px-2 py-1 text-xs font-extrabold uppercase tracking-wider text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary rounded-md transition-colors"
      title={isArabic ? 'English' : 'العربية'}
    >
      {isArabic ? 'EN' : 'AR'}
    </button>
  );
}
