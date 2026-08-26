import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settingsApi';
import { useToastStore } from '@/stores/toastStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/routes';

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function PrintBrandingPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data: print, isLoading: printLoading } = useQuery({
    queryKey: ['print-settings'],
    queryFn: () => settingsApi.getPrintSettings(),
  });

  const { data: branding, isLoading: brandingLoading } = useQuery({
    queryKey: ['branding-logo'],
    queryFn: () => settingsApi.getBrandingLogo(),
  });

  const effectiveWidth = width === '' ? (print?.print_width_mm ?? print?.print_width_default_mm ?? 62) : Number(width);
  const effectiveHeight = height === '' ? (print?.print_height_mm ?? print?.print_height_default_mm ?? 100) : Number(height);

  const handleSaveDimensions = async () => {
    if (print && effectiveWidth < print.print_width_min_mm) {
      addToast('error', t('settings.printBranding.widthTooSmall', { min: print.print_width_min_mm }));
      return;
    }
    if (print && effectiveWidth > print.print_width_max_mm) {
      addToast('error', t('settings.printBranding.widthTooLarge', { max: print.print_width_max_mm }));
      return;
    }
    if (print && effectiveHeight < print.print_height_min_mm) {
      addToast('error', t('settings.printBranding.heightTooSmall', { min: print.print_height_min_mm }));
      return;
    }
    if (print && effectiveHeight > print.print_height_max_mm) {
      addToast('error', t('settings.printBranding.heightTooLarge', { max: print.print_height_max_mm }));
      return;
    }
    try {
      await settingsApi.updatePrintSettings(effectiveWidth, effectiveHeight);
      queryClient.invalidateQueries({ queryKey: ['print-settings'] });
      setWidth('');
      setHeight('');
      addToast('success', t('settings.printBranding.dimensionsSaved'));
    } catch {
      addToast('error', t('settings.printBranding.dimensionsSaveFailed'));
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    try {
      await settingsApi.uploadBrandingLogo(logoFile);
      queryClient.invalidateQueries({ queryKey: ['branding-logo'] });
      setLogoFile(null);
      addToast('success', t('settings.printBranding.logoUploaded'));
    } catch {
      addToast('error', t('settings.printBranding.logoUploadFailed'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('settings.printBranding.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('settings.printBranding.description')}</p>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Print Settings */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('settings.printBranding.printTitle')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">
              {printLoading ? '…' : print?.description}
            </p>
          </div>
        </CardHeader>

        {printLoading ? (
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        ) : print ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary font-body mb-1">
                  {t('settings.printBranding.widthLabel')} ({t('settings.printBranding.mm')})
                </label>
                <input
                  type="number"
                  value={effectiveWidth}
                  min={print.print_width_min_mm}
                  max={print.print_width_max_mm}
                  onChange={(e) => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light font-body"
                />
                <p className="text-xs text-text-tertiary font-body mt-1">
                  {t('settings.printBranding.widthHint', { min: print.print_width_min_mm, max: print.print_width_max_mm, def: print.print_width_default_mm })}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary font-body mb-1">
                  {t('settings.printBranding.heightLabel')} ({t('settings.printBranding.mm')})
                </label>
                <input
                  type="number"
                  value={effectiveHeight}
                  min={print.print_height_min_mm}
                  max={print.print_height_max_mm}
                  onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light font-body"
                />
                <p className="text-xs text-text-tertiary font-body mt-1">
                  {t('settings.printBranding.heightHint', { min: print.print_height_min_mm, max: print.print_height_max_mm, def: print.print_height_default_mm })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="primary" size="sm" onClick={handleSaveDimensions}>
                  {t('settings.printBranding.saveDimensions')}
                </Button>
                {(width !== '' || height !== '') && (
                  <Button variant="secondary" size="sm" onClick={() => { setWidth(''); setHeight(''); }}>
                    {t('common.cancel')}
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary font-body mb-1">{t('settings.printBranding.previewLabel')}</label>
              <div className="border border-border-default rounded-xl overflow-hidden bg-white">
                <iframe
                  title="print-preview"
                  src={print.preview_url}
                  className="w-full h-72 border-0"
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-status-error font-body">{t('settings.printBranding.loadError')}</p>
        )}
      </Card>

      {/* Branding / Logo */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('settings.printBranding.brandingTitle')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('settings.printBranding.brandingDescription')}</p>
          </div>
        </CardHeader>

        {brandingLoading ? (
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ) : branding ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-24 h-24 rounded-xl border border-border-default bg-bg-section-alt flex items-center justify-center overflow-hidden flex-shrink-0">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt="Nexa logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-xs text-text-tertiary font-body">{t('settings.printBranding.noLogo')}</span>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-xs text-text-tertiary font-body">
                {branding.is_default ? t('settings.printBranding.usingDefaultLogo') : t('settings.printBranding.usingCustomLogo')}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  className="text-sm font-body text-text-secondary"
                />
                <Button variant="primary" size="sm" disabled={!logoFile} onClick={handleUploadLogo}>
                  {t('settings.printBranding.uploadLogo')}
                </Button>
                {logoFile && (
                  <Button variant="secondary" size="sm" onClick={() => setLogoFile(null)}>
                    {t('common.cancel')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-status-error font-body">{t('settings.printBranding.logoLoadError')}</p>
        )}
      </Card>
    </div>
  );
}
