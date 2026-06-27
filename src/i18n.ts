import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';
import ru from './locales/ru.json';
import he from './locales/he.json';

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('nexa-lang') : null;
const initialLang = savedLang || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    ru: { translation: ru },
    he: { translation: he },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
