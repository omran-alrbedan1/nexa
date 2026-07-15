import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSettings, useBulkUpdateSettings } from '../hooks/useSettings';
import { useCurrencyStore, type CurrencyCode, type ExchangeRates } from '@/stores/currencyStore';
import { useToastStore } from '@/stores/toastStore';
import { Settings as SettingsIcon, Shield, Users, Image, Bell, ClipboardList, Save, DollarSign, FileText, Menu, HelpCircle, Info } from 'lucide-react';

const SETTINGS_TABS = [
  { key: 'general', label: 'settings.tabs.general', icon: SettingsIcon },
  { key: 'roles', label: 'settings.tabs.roles', icon: Shield, route: ROUTES.SETTINGS_ROLES },
  { key: 'staff', label: 'settings.tabs.staff', icon: Users, route: ROUTES.SETTINGS_STAFF },
  { key: 'banners', label: 'settings.tabs.banners', icon: Image, route: ROUTES.SETTINGS_BANNERS },
  { key: 'notifications', label: 'settings.tabs.notifications', icon: Bell, route: ROUTES.SETTINGS_NOTIFICATIONS },
  { key: 'audit', label: 'settings.tabs.audit', icon: ClipboardList, route: ROUTES.SETTINGS_AUDIT },
  { key: 'faq', label: 'settings.tabs.faq', icon: HelpCircle, route: ROUTES.SETTINGS_FAQ },
  { key: 'about-nexa', label: 'settings.tabs.aboutNexa', icon: Info, route: ROUTES.SETTINGS_ABOUT_NEXA },
  { key: 'privacy-policy', label: 'settings.tabs.privacyPolicy', icon: FileText, route: ROUTES.SETTINGS_PRIVACY_POLICY },
  { key: 'navigation', label: 'settings.tabs.navigation', icon: Menu, route: ROUTES.SETTINGS_NAVIGATION },
];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: settings, isLoading } = useSettings();
  const bulkUpdate = useBulkUpdateSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const generalSettings = (settings || []).filter((s) => s.group === 'general' || !s.group);

  const storeCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const storeRates = useCurrencyStore((s) => s.exchangeRates);
  const setStoreCurrency = useCurrencyStore((s) => s.setCurrency);
  const setStoreRates = useCurrencyStore((s) => s.setExchangeRates);
  const addToast = useToastStore((s) => s.addToast);

  const [editCurrency, setEditCurrency] = useState<CurrencyCode>(storeCurrency);
  const [editRates, setEditRates] = useState<ExchangeRates>({ ...storeRates });

  const hasCurrencyChanges =
    editCurrency !== storeCurrency ||
    editRates.USD !== storeRates.USD ||
    editRates.ILS !== storeRates.ILS ||
    editRates.AED !== storeRates.AED;

  const handleCurrencySave = () => {
    setStoreCurrency(editCurrency);
    setStoreRates(editRates);
    addToast('success', t('settings.currency.saved'));
  };

  useEffect(() => {
    if (activeTab !== 'general') {
      const tab = SETTINGS_TABS.find((t) => t.key === activeTab);
      if (tab?.route) navigate(tab.route);
    }
  }, [activeTab, navigate]);

  const handleValueChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const changed = Object.entries(editedValues).map(([key, value]) => ({ key, value }));
    if (changed.length > 0) {
      bulkUpdate.mutate(changed);
      setEditedValues({});
    }
  };

  if (activeTab !== 'general') {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <SettingsIcon size={22} className="text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('settings.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('settings.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-bg-section-alt rounded-xl overflow-x-auto">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-white text-brand-primary shadow-sm font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon size={16} />
              {t(tab.label)}
            </button>
          );
        })}
      </div>

      {/* General Settings */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('settings.general.title')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('settings.general.description')}</p>
          </div>
          {Object.keys(editedValues).length > 0 && (
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

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        ) : generalSettings.length === 0 ? (
          <p className="text-sm text-text-tertiary font-body">{t('settings.general.noSettings')}</p>
        ) : (
          <div className="space-y-4">
            {generalSettings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border-default/60"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-bold text-text-primary font-body capitalize">
                    {setting.key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-text-tertiary font-body mt-0.5">{setting.group}</p>
                </div>
                <div className="flex-shrink-0 w-64">
                  {setting.type === 'boolean' ? (
                    <select
                      value={editedValues[setting.key] ?? setting.value}
                      onChange={(e) => handleValueChange(setting.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input"
                    >
                      <option value="1">{t('common.yes')}</option>
                      <option value="0">{t('common.no')}</option>
                    </select>
                  ) : (
                    <input
                      value={editedValues[setting.key] ?? setting.value}
                      onChange={(e) => handleValueChange(setting.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input"
                      type={setting.type === 'number' ? 'number' : 'text'}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Currency Settings */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <DollarSign size={20} className="text-brand-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary font-display">{t('settings.currency.title')}</h3>
              <p className="text-xs text-text-secondary font-body mt-0.5">{t('settings.currency.description')}</p>
            </div>
          </div>
          {hasCurrencyChanges && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save size={14} />}
              onClick={handleCurrencySave}
            >
              {t('common.save')}
            </Button>
          )}
        </div>

        <div className="mb-6">
          <label className="text-sm font-bold text-text-primary font-body mb-2 block">{t('settings.currency.displayCurrency')}</label>
          <select
            value={editCurrency}
            onChange={(e) => setEditCurrency(e.target.value as CurrencyCode)}
            className="w-full max-w-xs px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input"
          >
            <option value="USD">{t('settings.currency.usd')}</option>
            <option value="ILS">{t('settings.currency.ils')}</option>
            <option value="AED">{t('settings.currency.aed')}</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-text-primary font-body mb-2 block">{t('settings.currency.exchangeRates')}</label>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border-default/60">
              <p className="text-sm font-bold text-text-primary font-body">{t('settings.currency.usd')}</p>
              <div className="flex items-center gap-2">
                <input
                  value={editRates.USD}
                  onChange={(e) => setEditRates((prev) => ({ ...prev, USD: parseFloat(e.target.value) || 0 }))}
                  className="w-32 px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input text-right"
                  type="number"
                  step="0.001"
                  min="0.001"
                />
                <span className="text-xs text-text-tertiary">{t('settings.currency.baseNote')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border-default/60">
              <p className="text-sm font-bold text-text-primary font-body">{t('settings.currency.ils')}</p>
              <input
                value={editRates.ILS}
                onChange={(e) => setEditRates((prev) => ({ ...prev, ILS: parseFloat(e.target.value) || 0 }))}
                className="w-32 px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input text-right"
                type="number"
                step="0.001"
                min="0.001"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border-default/60">
              <p className="text-sm font-bold text-text-primary font-body">{t('settings.currency.aed')}</p>
              <input
                value={editRates.AED}
                onChange={(e) => setEditRates((prev) => ({ ...prev, AED: parseFloat(e.target.value) || 0 }))}
                className="w-32 px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input text-right"
                type="number"
                step="0.001"
                min="0.001"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
