import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings, useBulkUpdateSettings } from '../hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, Globe, Info } from 'lucide-react';

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

type Values = {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
};

function getApiValues(settings: Record<string, string>): Values {
  return {
    titleAr: settings['about_title_ar'] ?? '',
    titleEn: settings['about_title_en'] ?? '',
    contentAr: settings['about_content_ar'] ?? '',
    contentEn: settings['about_content_en'] ?? '',
  };
}

export function AboutNexaPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useSettings();
  const bulkUpdate = useBulkUpdateSettings();

  const [activeLang, setActiveLang] = useState<'ar' | 'en'>('ar');

  const aboutSettings = useMemo(() => {
    const map: Record<string, string> = {};
    (settings || []).filter((s) => s.group === 'about').forEach((s) => {
      map[s.key] = s.value;
    });
    return map;
  }, [settings]);

  const apiValues = useMemo(() => getApiValues(aboutSettings), [aboutSettings]);

  const [draft, setDraft] = useState<Values | null>(null);

  const values = draft ?? apiValues;

  const needsSync = draft !== null;

  const updateField = (field: keyof Values, value: string) => {
    setDraft((prev) => ({
      ...(prev ?? apiValues),
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!draft) return;
    const changed: { key: string; value: string }[] = [];

    if (draft.titleAr !== apiValues.titleAr) changed.push({ key: 'about_title_ar', value: draft.titleAr });
    if (draft.titleEn !== apiValues.titleEn) changed.push({ key: 'about_title_en', value: draft.titleEn });
    if (draft.contentAr !== apiValues.contentAr) changed.push({ key: 'about_content_ar', value: draft.contentAr });
    if (draft.contentEn !== apiValues.contentEn) changed.push({ key: 'about_content_en', value: draft.contentEn });

    if (changed.length > 0) {
      bulkUpdate.mutate(changed, { onSuccess: () => setDraft(null) });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.about.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('settings.about.description')}</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Info size={22} className="text-brand-accent" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('settings.about.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('settings.about.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      <div className="flex items-center gap-1 p-1 bg-bg-section-alt rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveLang('ar')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all',
            activeLang === 'ar'
              ? 'bg-white text-brand-accent shadow-sm font-bold'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Globe size={15} />
          {t('settings.about.arabicTab')}
        </button>
        <button
          type="button"
          onClick={() => setActiveLang('en')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all',
            activeLang === 'en'
              ? 'bg-white text-brand-accent shadow-sm font-bold'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Globe size={15} />
          {t('settings.about.englishTab')}
        </button>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">
              {activeLang === 'ar' ? t('settings.about.arabicContent') : t('settings.about.englishContent')}
            </h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">
              {activeLang === 'ar'
                ? t('settings.about.arabicContentHint')
                : t('settings.about.englishContentHint')}
            </p>
          </div>
          {needsSync && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save size={14} />}
              isLoading={bulkUpdate.isPending}
              onClick={handleSave}
            >
              {t('common.save')}
            </Button>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-text-primary font-body mb-1.5">
              {activeLang === 'ar' ? t('settings.about.titleLabelAr') : t('settings.about.titleLabelEn')}
            </label>
            <Input
              value={activeLang === 'ar' ? values.titleAr : values.titleEn}
              onChange={(e) => updateField(activeLang === 'ar' ? 'titleAr' : 'titleEn', e.target.value)}
              placeholder={activeLang === 'ar' ? t('settings.about.titlePlaceholderAr') : t('settings.about.titlePlaceholderEn')}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-primary font-body mb-1.5">
              {activeLang === 'ar' ? t('settings.about.contentLabelAr') : t('settings.about.contentLabelEn')}
            </label>
            <RichTextEditor
              content={activeLang === 'ar' ? values.contentAr : values.contentEn}
              onChange={(html) => updateField(activeLang === 'ar' ? 'contentAr' : 'contentEn', html)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
