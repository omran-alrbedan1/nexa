import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { campaignsApi, type Campaign } from '../api/campaignsApi';
import { categoriesApi, type Category } from '@/features/categories/api/categoriesApi';
import { ArrowLeft, Megaphone, Save, Image as ImageIcon, Plus, X, Package, Tag, Clock } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiHelpers';

interface EditCampaignFormItem {
  key: number;
  nameAr: string;
  nameEn: string;
  description: string;
  categoryId: string;
  unit: string;
  price: string;
  stockQuantity: string;
}

export function EditCampaignPage() {
  const { t } = useTranslation();
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const id = parseInt(campaignId || '0', 10);

  const [form, setForm] = useState({
    name: '', nameAr: '', subtitleAr: '', subtitleEn: '',
    description: '', descriptionEn: '', targetRegion: '1',
    startDate: '', endDate: '', orderingClosesAt: '',
    deliveryLeadTimeMinDays: '', deliveryLeadTimeMaxDays: '',
    isStockLimited: false, stockTotalQuantity: '', stockReservedQuantity: '',
    stockSoldQuantity: '0', stockLowStockThreshold: '', stockUnit: 'item',
    status: 'draft',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [items, setItems] = useState<EditCampaignFormItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id <= 0) return;
    setLoading(true);
    setError(null);
    campaignsApi.getCampaign(id)
      .then((c) => {
        setCampaign(c);
        setForm({
          name: c.name,
          nameAr: c.nameAr,
          subtitleAr: c.subtitleAr || '',
          subtitleEn: c.subtitleEn || '',
          description: c.description,
          descriptionEn: c.descriptionEn || '',
          targetRegion: String(c.zoneId),
          startDate: c.startDate.split('T')[0],
          endDate: c.endDate.split('T')[0],
          orderingClosesAt: c.orderingClosesAt ? c.orderingClosesAt.replace('Z', '').slice(0, 16) : '',
          deliveryLeadTimeMinDays: c.deliveryLeadTimeMinDays !== null ? String(c.deliveryLeadTimeMinDays) : '',
          deliveryLeadTimeMaxDays: c.deliveryLeadTimeMaxDays !== null ? String(c.deliveryLeadTimeMaxDays) : '',
          isStockLimited: c.isStockLimited,
          stockTotalQuantity: c.stockTotalQuantity !== null ? String(c.stockTotalQuantity) : '',
          stockReservedQuantity: c.stockReservedQuantity !== null ? String(c.stockReservedQuantity) : '',
          stockSoldQuantity: String(c.stockSoldQuantity),
          stockLowStockThreshold: c.stockLowStockThreshold !== null ? String(c.stockLowStockThreshold) : '',
          stockUnit: c.stockUnit || 'item',
          status: c.status,
        });
        setImagePreview(c.bannerUrl);
        const mappedItems = (c.items || []).map((ci, idx) => ({
          key: ++nextKey.current,
          nameAr: ci.nameAr,
          nameEn: ci.nameEn ?? '',
          description: ci.description ?? '',
          categoryId: String(ci.categoryId),
          unit: ci.unit,
          price: String(ci.price),
          stockQuantity: String(ci.stockQuantity),
        }));
        setItems(mappedItems);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('campaigns.edit.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    const key = ++nextKey.current;
    setItems((prev) => [...prev, {
      key, nameAr: '', nameEn: '', description: '',
      categoryId: '', unit: '', price: '', stockQuantity: '',
    }]);
  };

  const removeItem = (key: number) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const updateItem = (key: number, field: string, value: string) => {
    setItems((prev) => prev.map((i) => i.key === key ? { ...i, [field]: value } : i));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      addToast('error', t('campaigns.edit.validationRequired'));
      return;
    }
    setSaving(true);
    try {
      await campaignsApi.updateCampaign(id, {
        name: form.name,
        nameAr: form.nameAr || undefined,
        subtitleAr: form.subtitleAr || undefined,
        subtitleEn: form.subtitleEn || undefined,
        description: form.description || undefined,
        descriptionEn: form.descriptionEn || undefined,
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
        image: imageFile || undefined,
        items: items.map((item) => ({
          nameAr: item.nameAr,
          nameEn: item.nameEn || undefined,
          description: item.description || undefined,
          categoryId: parseInt(item.categoryId, 10),
          unit: item.unit,
          price: parseFloat(item.price),
          stockQuantity: item.stockQuantity ? parseFloat(item.stockQuantity) : undefined,
        })),
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      addToast('success', t('campaigns.toast.updatedSuccessfully'));
      navigate(ROUTES.CAMPAIGN_DETAIL(id));
    } catch (err) {
      addToast('error', extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-up max-w-4xl">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="h-36 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-up max-w-4xl">
        <button onClick={() => navigate(ROUTES.CAMPAIGNS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('campaigns.create.backToCampaigns')}
        </button>
        <ErrorState
          title={t('campaigns.edit.errorTitle')}
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all";
  const labelClass = "block text-xs font-bold text-text-secondary mb-1.5 tracking-wide";
  const selectClass = "w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all appearance-none";

  return (
    <div className="space-y-8 animate-fade-up max-w-5xl mx-auto pb-12">
      {/* Back */}
      <button onClick={() => navigate(ROUTES.CAMPAIGN_DETAIL(id))} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        {t('campaigns.edit.back')}
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Megaphone size={24} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('campaigns.edit.title')}</h1>
            <p className="text-sm text-text-secondary font-body">{t('campaigns.edit.editDescription')}</p>
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
              <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.edit.campaignDetails')}</h3>
              <p className="text-xs text-text-secondary font-body">{t('campaigns.edit.campaignDetailsDesc')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>{t('campaigns.edit.nameEn')}</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} placeholder={t('campaigns.edit.nameEnPlaceholder')} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.edit.nameAr')}</label>
              <input value={form.nameAr} onChange={(e) => handleChange('nameAr', e.target.value)} className={inputClass} placeholder={t('campaigns.edit.nameArPlaceholder')} dir="rtl" />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.edit.subtitleAr')}</label>
              <input value={form.subtitleAr} onChange={(e) => handleChange('subtitleAr', e.target.value)} className={inputClass} placeholder={t('campaigns.edit.subtitleArPlaceholder')} dir="rtl" />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.edit.subtitleEn')}</label>
              <input value={form.subtitleEn} onChange={(e) => handleChange('subtitleEn', e.target.value)} className={inputClass} placeholder={t('campaigns.edit.subtitleEnPlaceholder')} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.edit.description')}</label>
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder={t('campaigns.edit.descriptionPlaceholder')} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.edit.descriptionEn')}</label>
              <textarea value={form.descriptionEn} onChange={(e) => handleChange('descriptionEn', e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder={t('campaigns.edit.descriptionEnPlaceholder')} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>{t('campaigns.edit.targetZone')}</label>
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
              <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.edit.schedule')}</h3>
              <p className="text-xs text-text-secondary font-body">{t('campaigns.edit.scheduleDesc')}</p>
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
              <label className={labelClass}>{t('campaigns.edit.orderingClosesAt')}</label>
              <input type="datetime-local" value={form.orderingClosesAt} onChange={(e) => handleChange('orderingClosesAt', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.edit.status')}</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className={selectClass}
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}>
                <option value="draft">{t('campaigns.edit.draft')}</option>
                <option value="scheduled">{t('campaigns.edit.scheduled')}</option>
                <option value="active">{t('campaigns.edit.active')}</option>
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
              <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.edit.delivery')}</h3>
              <p className="text-xs text-text-secondary font-body">{t('campaigns.edit.deliveryDesc')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('campaigns.edit.minDays')}</label>
                <input type="number" min="0" value={form.deliveryLeadTimeMinDays} onChange={(e) => handleChange('deliveryLeadTimeMinDays', e.target.value)} className={inputClass} placeholder={t('campaigns.create.minDaysPlaceholder')} />
              </div>
              <div>
                <label className={labelClass}>{t('campaigns.edit.maxDays')}</label>
                <input type="number" min="0" value={form.deliveryLeadTimeMaxDays} onChange={(e) => handleChange('deliveryLeadTimeMaxDays', e.target.value)} className={inputClass} placeholder={t('campaigns.create.maxDaysPlaceholder')} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Image Upload */}
      <Card padding="lg">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border-default/50">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <ImageIcon size={16} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.edit.campaignImage')}</h3>
            <p className="text-xs text-text-secondary font-body">{t('campaigns.edit.campaignImageDesc')}</p>
          </div>
        </div>
        {imagePreview ? (
          <div className="relative overflow-hidden rounded-xl mb-4 group">
            <img src={imagePreview} alt="Campaign preview" className="w-full h-48 md:h-72 object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-2 px-4 py-2 bg-white/90 rounded-xl text-sm font-bold text-text-primary hover:bg-white">
                <ImageIcon size={16} />
                {t('campaigns.edit.changeImage')}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 md:h-56 border-2 border-dashed border-border-default rounded-xl cursor-pointer hover:border-brand-primary hover:bg-brand-accent/5 transition-all group">
            <div className="flex flex-col items-center gap-2 text-text-tertiary group-hover:text-brand-accent transition-colors">
              <ImageIcon size={32} />
              <span className="text-sm font-bold">{t('campaigns.edit.uploadImage')}</span>
              <span className="text-xs">{t('campaigns.edit.dragDropHint')}</span>
            </div>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
        {imageFile && (
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={() => { setImageFile(null); setImagePreview(campaign?.bannerUrl || null); }}>
              {t('campaigns.edit.removeImage')}
            </Button>
          </div>
        )}
      </Card>

      {/* Stock Management */}
      <Card padding="lg">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border-default/50">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Package size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.edit.stockManagement')}</h3>
            <p className="text-xs text-text-secondary font-body">{t('campaigns.edit.stockManagementDesc')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-section-alt border border-border-default/60">
          <div className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="stock-toggle" checked={form.isStockLimited} onChange={(e) => setForm((prev) => ({ ...prev, isStockLimited: e.target.checked }))} className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary" />
          </div>
          <label htmlFor="stock-toggle" className="text-sm font-bold text-text-primary font-body cursor-pointer select-none">
            {form.isStockLimited ? t('campaigns.edit.stockLimited') : t('campaigns.edit.unlimitedStock')}
          </label>
        </div>
        {form.isStockLimited && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('campaigns.edit.totalQuantity')}</label>
              <input type="number" min="0" value={form.stockTotalQuantity} onChange={(e) => handleChange('stockTotalQuantity', e.target.value)} className={inputClass} placeholder={t('campaigns.create.totalQuantityPlaceholder')} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.edit.reserved')}</label>
              <input type="number" min="0" value={form.stockReservedQuantity} onChange={(e) => handleChange('stockReservedQuantity', e.target.value)} className={inputClass} placeholder={t('campaigns.create.reservedPlaceholder')} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.edit.alreadySold')}</label>
              <input type="number" min="0" value={form.stockSoldQuantity} onChange={(e) => handleChange('stockSoldQuantity', e.target.value)} className={inputClass} placeholder={t('campaigns.create.alreadySoldPlaceholder')} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.edit.lowStockThreshold')}</label>
              <input type="number" min="0" value={form.stockLowStockThreshold} onChange={(e) => handleChange('stockLowStockThreshold', e.target.value)} className={inputClass} placeholder={t('campaigns.create.lowStockThresholdPlaceholder')} />
            </div>
            <div>
              <label className={labelClass}>{t('campaigns.edit.stockUnit')}</label>
              <input value={form.stockUnit} onChange={(e) => handleChange('stockUnit', e.target.value)} className={inputClass} placeholder={t('campaigns.edit.stockUnitPlaceholder')} />
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
              <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.edit.campaignItems')}</h3>
              <p className="text-xs text-text-secondary font-body">{t('campaigns.edit.campaignItemsDesc')}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={addItem}>{t('campaigns.edit.addItem')}</Button>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-10">
            <Package size={40} className="mx-auto text-text-tertiary/40 mb-3" />
            <p className="text-sm text-text-tertiary font-body">{t('campaigns.edit.noItems')}</p>
            <p className="text-xs text-text-tertiary/60 font-body mt-1">{t('campaigns.edit.noItemsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.key} className="p-5 rounded-xl border border-border-default/60 bg-white/50 hover:border-border-default transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider bg-bg-section-alt px-2.5 py-1 rounded-lg">{t('campaigns.create.itemLabel', { number: items.indexOf(item) + 1 })}</span>
                  <button onClick={() => removeItem(item.key)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-tertiary hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">{t('campaigns.edit.itemNameAr')}</label>
                    <input value={item.nameAr} onChange={(e) => updateItem(item.key, 'nameAr', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder={t('campaigns.edit.itemNameArPlaceholder')} dir="rtl" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">{t('campaigns.edit.itemNameEn')}</label>
                    <input value={item.nameEn} onChange={(e) => updateItem(item.key, 'nameEn', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder={t('campaigns.edit.itemNameEnPlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">{t('campaigns.edit.itemCategory')}</label>
                    <select value={item.categoryId} onChange={(e) => updateItem(item.key, 'categoryId', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all">
                      <option value="">{t('campaigns.edit.selectCategory')}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nameEn || cat.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">{t('campaigns.edit.itemUnit')}</label>
                    <input value={item.unit} onChange={(e) => updateItem(item.key, 'unit', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder={t('campaigns.edit.itemUnitPlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">{t('campaigns.edit.itemPrice')}</label>
                    <input type="number" step="0.01" min="0" value={item.price} onChange={(e) => updateItem(item.key, 'price', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder={t('campaigns.edit.itemPricePlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">{t('campaigns.edit.itemStockQty')}</label>
                    <input type="number" min="0" value={item.stockQuantity} onChange={(e) => updateItem(item.key, 'stockQuantity', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder={t('campaigns.edit.itemStockQtyPlaceholder')} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-text-secondary mb-1">{t('campaigns.edit.itemDescription')}</label>
                    <input value={item.description} onChange={(e) => updateItem(item.key, 'description', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder={t('campaigns.edit.itemDescriptionPlaceholder')} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default/50">
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.CAMPAIGN_DETAIL(id))}>{t('common.cancel')}</Button>
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} isLoading={saving} onClick={handleSubmit}>{t('campaigns.edit.saveCampaign')}</Button>
      </div>
    </div>
  );
}
