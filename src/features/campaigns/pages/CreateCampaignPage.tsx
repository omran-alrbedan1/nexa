import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { campaignsApi } from '../api/campaignsApi';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';
import { VariantEditor, type VariantDraft } from '@/features/products/components/VariantEditor';
import { categoriesApi, type Category } from '@/features/categories/api/categoriesApi';
import { ArrowLeft, Megaphone, Save, Plus, X, Package, Tag, Clock } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiHelpers';

interface CampaignFormItem {
  key: number;
  names: Partial<Record<TranslatedLang, string>>;
  descriptions: Partial<Record<TranslatedLang, string>>;
  categoryId: string;
  unit: string;
  price: string;
  stockQuantity: string;
  variants: VariantDraft[];
}

export function CreateCampaignPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    targetRegion: '1',
    startDate: '', endDate: '', orderingClosesAt: '',
    deliveryLeadTimeMinDays: '', deliveryLeadTimeMaxDays: '',
    isStockLimited: false, stockTotalQuantity: '', stockReservedQuantity: '',
    stockSoldQuantity: '0', stockLowStockThreshold: '', stockUnit: 'item',
    status: 'draft',
  });
  const [names, setNames] = useState<Partial<Record<TranslatedLang, string>>>({});
  const [subtitles, setSubtitles] = useState<Partial<Record<TranslatedLang, string>>>({});
  const [descriptions, setDescriptions] = useState<Partial<Record<TranslatedLang, string>>>({});
  const [items, setItems] = useState<CampaignFormItem[]>([]);
  const nextKey = useRef(0);

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });
  const categories: Category[] = catData?.categories ?? [];

  const { data: zones } = useQuery({
    queryKey: ['zones'],
    queryFn: () => campaignsApi.getZones(),
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const key = ++nextKey.current;
    setItems((prev) => [...prev, {
      key, names: {}, descriptions: {},
      categoryId: '', unit: '', price: '', stockQuantity: '', variants: [],
    }]);
  };

  const removeItem = (key: number) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const updateItem = (key: number, field: string, value: string) => {
    setItems((prev) => prev.map((i) => i.key === key ? { ...i, [field]: value } : i));
  };

  const updateItemVariants = (key: number, variants: VariantDraft[]) => {
    setItems((prev) => prev.map((i) => i.key === key ? { ...i, variants } : i));
  };

  const updateItemNames = (key: number, lang: TranslatedLang, value: string) => {
    setItems((prev) => prev.map((i) => i.key === key ? { ...i, names: { ...i.names, [lang]: value } } : i));
  };

  const updateItemDescriptions = (key: number, lang: TranslatedLang, value: string) => {
    setItems((prev) => prev.map((i) => i.key === key ? { ...i, descriptions: { ...i.descriptions, [lang]: value } } : i));
  };

  const createCampaign = useMutation({
    mutationFn: () => campaignsApi.createCampaign({
      name: names.en ?? '',
      nameAr: names.ar || undefined,
      nameHe: names.he,
      nameRu: names.ru,
      subtitleAr: subtitles.ar || undefined,
      subtitleEn: subtitles.en || undefined,
      subtitleHe: subtitles.he,
      subtitleRu: subtitles.ru,
      description: descriptions.ar || undefined,
      descriptionEn: descriptions.en || undefined,
      descriptionHe: descriptions.he,
      zoneId: parseInt(form.targetRegion, 10),
      startsAt: form.startDate,
      endsAt: form.endDate,
      orderingClosesAt: form.orderingClosesAt || undefined,
      deliveryLeadTimeMinDays: form.deliveryLeadTimeMinDays ? parseInt(form.deliveryLeadTimeMinDays, 10) : undefined,
      deliveryLeadTimeMaxDays: form.deliveryLeadTimeMaxDays ? parseInt(form.deliveryLeadTimeMaxDays, 10) : undefined,
      isStockLimited: form.isStockLimited,
      stockTotalQuantity: form.isStockLimited && form.stockTotalQuantity ? parseInt(form.stockTotalQuantity, 10) : undefined,
      stockReservedQuantity: form.isStockLimited && form.stockReservedQuantity ? parseInt(form.stockReservedQuantity, 10) : undefined,
      stockSoldQuantity: form.isStockLimited && form.stockSoldQuantity ? parseInt(form.stockSoldQuantity, 10) : 0,
      stockLowStockThreshold: form.isStockLimited && form.stockLowStockThreshold ? parseInt(form.stockLowStockThreshold, 10) : undefined,
      stockUnit: form.stockUnit || 'item',
      status: form.status,
      items: items.map((item) => ({
        nameAr: item.names.ar ?? '',
        nameEn: item.names.en || undefined,
        nameHe: item.names.he,
        nameRu: item.names.ru,
        description: item.descriptions.ar || undefined,
        descriptionHe: item.descriptions.he,
        categoryId: parseInt(item.categoryId, 10),
        unit: item.unit,
        price: parseFloat(item.price),
        stockQuantity: item.stockQuantity ? parseFloat(item.stockQuantity) : undefined,
        variants: item.variants.map((v) => ({
          nameAr: v.name_ar,
          nameEn: v.name_en || undefined,
          nameHe: v.name_he || undefined,
          nameRu: v.name_ru || undefined,
          price: v.price,
          stockQuantity: v.stock_quantity,
          isActive: v.is_active ?? true,
        })),
      })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      addToast('success', t('campaigns.toast.createdSuccessfully'));
      navigate(ROUTES.CAMPAIGNS);
    },
    onError: (error) => {
      addToast('error', extractErrorMessage(error));
    },
  });

  const handleSubmit = () => {
    if (!names.ar?.trim() || !form.startDate || !form.endDate) {
      addToast('error', t('campaigns.create.requiredValidation'));
      return;
    }
    if (items.some((i) => !i.names.ar?.trim() || !i.categoryId || !i.unit || !i.price)) {
      addToast('error', t('campaigns.create.itemsValidation'));
      return;
    }
    createCampaign.mutate();
  };

  const inputClass = "w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all";
  const labelClass = "block text-xs font-bold text-text-secondary mb-1.5 tracking-wide";
  const selectClass = "w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all appearance-none";

  return (
    <div className="space-y-8 animate-fade-up max-w-5xl mx-auto pb-12">
      {/* Back */}
      <button onClick={() => navigate(ROUTES.CAMPAIGNS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        {t('campaigns.create.back')}
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Megaphone size={24} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('campaigns.create.title')}</h1>
            <p className="text-sm text-text-secondary font-body">{t('campaigns.create.subtitle')}</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Details */}
        <Card padding="lg" className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border-default/50">
            <div className="w-8 h-8 rounded-lg bg-brand-accent-light flex items-center justify-center">
              <Tag size={16} className="text-brand-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.create.detailsTitle')}</h3>
              <p className="text-xs text-text-secondary font-body">{t('campaigns.create.detailsSubtitle')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <TranslatedField
                label={t('campaigns.create.name')}
                values={names}
                onChange={(key, value) => setNames({ ...names, [key]: value })}
                placeholder={t('campaigns.create.namePlaceholder')}
                required
              />
            </div>
            <div>
              <TranslatedField
                label={t('campaigns.create.subtitle')}
                values={subtitles}
                onChange={(key, value) => setSubtitles({ ...subtitles, [key]: value })}
                placeholder={t('campaigns.create.subtitlePlaceholder')}
              />
            </div>
            <div className="md:col-span-2">
              <TranslatedField
                label={t('campaigns.create.description')}
                values={descriptions}
                onChange={(key, value) => setDescriptions({ ...descriptions, [key]: value })}
                placeholder={t('campaigns.create.descriptionPlaceholder')}
                textarea
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>{t('campaigns.create.targetZone')}</label>
              <select value={form.targetRegion} onChange={(e) => handleChange('targetRegion', e.target.value)} className={selectClass}
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}>
                {(zones || []).map((z) => (
                  <option key={z.id} value={z.id}>{z.name_en || z.name_ar}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Schedule */}
        <Card padding="lg">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border-default/50">
            <div className="w-8 h-8 rounded-lg bg-brand-primary-light flex items-center justify-center">
              <Clock size={16} className="text-brand-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.create.scheduleTitle')}</h3>
              <p className="text-xs text-text-secondary font-body">{t('campaigns.create.scheduleSubtitle')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('campaigns.create.startDate')}</label>
                <input type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('campaigns.create.endDate')}</label>
                <input type="date" value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.create.orderingClosesAt')}</label>
              <input type="datetime-local" value={form.orderingClosesAt} onChange={(e) => handleChange('orderingClosesAt', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.create.initialStatus')}</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className={selectClass}
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}>
                <option value="draft">{t('campaigns.create.statusDraft')}</option>
                <option value="scheduled">{t('campaigns.create.statusScheduled')}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Delivery */}
        <Card padding="lg">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border-default/50">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Package size={16} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.create.deliveryTitle')}</h3>
              <p className="text-xs text-text-secondary font-body">{t('campaigns.create.deliverySubtitle')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('campaigns.create.minDays')}</label>
                <input type="number" min="0" value={form.deliveryLeadTimeMinDays} onChange={(e) => handleChange('deliveryLeadTimeMinDays', e.target.value)} className={inputClass} placeholder="1" />
              </div>
              <div>
                <label className={labelClass}>{t('campaigns.create.maxDays')}</label>
                <input type="number" min="0" value={form.deliveryLeadTimeMaxDays} onChange={(e) => handleChange('deliveryLeadTimeMaxDays', e.target.value)} className={inputClass} placeholder="3" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Management */}
      <Card padding="lg">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border-default/50">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Package size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.create.stockTitle')}</h3>
            <p className="text-xs text-text-secondary font-body">{t('campaigns.create.stockSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-section-alt border border-border-default/60">
          <div className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="stock-toggle" checked={form.isStockLimited} onChange={(e) => setForm((prev) => ({ ...prev, isStockLimited: e.target.checked }))} className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary" />
          </div>
          <label htmlFor="stock-toggle" className="text-sm font-bold text-text-primary font-body cursor-pointer select-none">
            {form.isStockLimited ? t('campaigns.create.stockLimited') : t('campaigns.create.stockUnlimited')}
          </label>
        </div>
        {form.isStockLimited && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('campaigns.create.stockTotal')}</label>
              <input type="number" min="0" value={form.stockTotalQuantity} onChange={(e) => handleChange('stockTotalQuantity', e.target.value)} className={inputClass} placeholder={t('campaigns.create.placeholder.stockTotalQuantity')} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.create.stockReserved')}</label>
              <input type="number" min="0" value={form.stockReservedQuantity} onChange={(e) => handleChange('stockReservedQuantity', e.target.value)} className={inputClass} placeholder={t('campaigns.create.placeholder.stockReservedQuantity')} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.create.stockSold')}</label>
              <input type="number" min="0" value={form.stockSoldQuantity} onChange={(e) => handleChange('stockSoldQuantity', e.target.value)} className={inputClass} placeholder={t('campaigns.create.placeholder.stockSoldQuantity')} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.create.stockLowThreshold')}</label>
              <input type="number" min="0" value={form.stockLowStockThreshold} onChange={(e) => handleChange('stockLowStockThreshold', e.target.value)} className={inputClass} placeholder={t('campaigns.create.placeholder.stockLowStockThreshold')} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.create.stockUnit')}</label>
              <input value={form.stockUnit} onChange={(e) => handleChange('stockUnit', e.target.value)} className={inputClass} placeholder={t('campaigns.create.placeholder.stockUnit')} />
            </div>
          </div>
        )}
      </Card>

      {/* Campaign Items */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-default/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent-light flex items-center justify-center">
              <Package size={16} className="text-brand-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.create.itemsTitle')}</h3>
              <p className="text-xs text-text-secondary font-body">{t('campaigns.create.itemsSubtitle')}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={addItem}>{t('campaigns.create.addItem')}</Button>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-10">
            <Package size={40} className="mx-auto text-text-tertiary/40 mb-3" />
            <p className="text-sm text-text-tertiary font-body">{t('campaigns.create.noItems')}</p>
            <p className="text-xs text-text-tertiary/60 font-body mt-1">{t('campaigns.create.noItemsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.key} className="p-5 rounded-xl border border-border-default/60 bg-white/50 hover:border-border-default transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider bg-bg-section-alt px-2.5 py-1 rounded-lg">{t('campaigns.create.itemNumber', { number: items.indexOf(item) + 1 })}</span>
                  <button onClick={() => removeItem(item.key)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-tertiary hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <TranslatedField
                      label={t('campaigns.create.itemName')}
                      values={item.names}
                      onChange={(key, value) => updateItemNames(item.key, key, value)}
                      placeholder={t('campaigns.create.itemNamePlaceholder')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">{t('campaigns.create.itemCategory')}</label>
                    <select value={item.categoryId} onChange={(e) => updateItem(item.key, 'categoryId', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all">
                      <option value="">{t('campaigns.create.selectCategory')}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nameEn || cat.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">{t('campaigns.create.itemUnit')}</label>
                    <input value={item.unit} onChange={(e) => updateItem(item.key, 'unit', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder={t('campaigns.create.placeholder.itemUnit')} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">{t('campaigns.create.itemPrice')}</label>
                    <input type="number" step="0.01" min="0" value={item.price} onChange={(e) => updateItem(item.key, 'price', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">{t('campaigns.create.itemStockQty')}</label>
                    <input type="number" min="0" value={item.stockQuantity} onChange={(e) => updateItem(item.key, 'stockQuantity', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="0" />
                  </div>
                  <div className="sm:col-span-2">
                    <TranslatedField
                      label={t('campaigns.create.description')}
                      values={item.descriptions}
                      onChange={(key, value) => updateItemDescriptions(item.key, key, value)}
                      placeholder={t('campaigns.create.itemDescriptionPlaceholder')}
                    />
                  </div>
                </div>
                <div className="mt-4 border-t border-border-default/50 pt-4">
                  <VariantEditor value={item.variants} onChange={(variants) => updateItemVariants(item.key, variants)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default/50">
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.CAMPAIGNS)}>{t('common.cancel')}</Button>
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} isLoading={createCampaign.isPending} onClick={handleSubmit}>{t('campaigns.create.save')}</Button>
      </div>
    </div>
  );
}
