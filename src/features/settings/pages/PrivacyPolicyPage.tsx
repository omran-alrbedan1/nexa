import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings, useBulkUpdateSettings } from '../hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, Globe, FileText } from 'lucide-react';

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
    titleAr: settings['privacy_policy_title_ar'] ?? '',
    titleEn: settings['privacy_policy_title_en'] ?? '',
    contentAr: settings['privacy_policy_content_ar'] ?? '',
    contentEn: settings['privacy_policy_content_en'] ?? '',
  };
}

export function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useSettings();
  const bulkUpdate = useBulkUpdateSettings();

  const [activeLang, setActiveLang] = useState<'ar' | 'en'>('ar');

  const legalSettings = useMemo(() => {
    const map: Record<string, string> = {};
    (settings || []).filter((s) => s.group === 'legal').forEach((s) => {
      map[s.key] = s.value;
    });
    return map;
  }, [settings]);

  const apiValues = useMemo(() => getApiValues(legalSettings), [legalSettings]);

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

    if (draft.titleAr !== apiValues.titleAr) changed.push({ key: 'privacy_policy_title_ar', value: draft.titleAr });
    if (draft.titleEn !== apiValues.titleEn) changed.push({ key: 'privacy_policy_title_en', value: draft.titleEn });
    if (draft.contentAr !== apiValues.contentAr) changed.push({ key: 'privacy_policy_content_ar', value: draft.contentAr });
    if (draft.contentEn !== apiValues.contentEn) changed.push({ key: 'privacy_policy_content_en', value: draft.contentEn });

    if (changed.length > 0) {
      bulkUpdate.mutate(changed, { onSuccess: () => setDraft(null) });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.privacyPolicy.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('settings.privacyPolicy.description')}</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <FileText size={22} className="text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">
                {t('settings.privacyPolicy.title')}
              </h1>
              <p className="text-sm text-text-secondary font-body">
                {t('settings.privacyPolicy.description')}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      <div className="flex items-center gap-1 p-1 bg-bg-section-alt rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveLang('ar')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all',
            activeLang === 'ar'
              ? 'bg-white text-brand-primary shadow-sm font-bold'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Globe size={15} />
          العربية
        </button>
        <button
          type="button"
          onClick={() => setActiveLang('en')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all',
            activeLang === 'en'
              ? 'bg-white text-brand-primary shadow-sm font-bold'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Globe size={15} />
          English
        </button>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">
              {activeLang === 'ar' ? 'المحتوى العربي' : 'English Content'}
            </h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">
              {activeLang === 'ar'
                ? 'قم بتعديل سياسة الخصوصية باللغة العربية'
                : 'Edit the privacy policy in English'}
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
              {t('settings.privacyPolicy.titleLabel')}
            </label>
            <Input
              value={activeLang === 'ar' ? values.titleAr : values.titleEn}
              onChange={(e) => updateField(activeLang === 'ar' ? 'titleAr' : 'titleEn', e.target.value)}
              placeholder={activeLang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-primary font-body mb-1.5">
              {t('settings.privacyPolicy.contentLabel')}
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
