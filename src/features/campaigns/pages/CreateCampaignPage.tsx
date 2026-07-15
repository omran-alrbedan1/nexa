import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { campaignsApi } from '../api/campaignsApi';
import { categoriesApi, type Category } from '@/features/categories/api/categoriesApi';
import { ArrowLeft, Megaphone, Save, Plus, X, Package, Tag, Clock } from 'lucide-react';

interface CampaignFormItem {
  key: number;
  nameAr: string;
  nameEn: string;
  description: string;
  categoryId: string;
  unit: string;
  price: string;
  stockQuantity: string;
}

export function CreateCampaignPage() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', nameAr: '', subtitleAr: '', subtitleEn: '',
    description: '', descriptionEn: '', targetRegion: '1',
    startDate: '', endDate: '', orderingClosesAt: '',
    deliveryLeadTimeMinDays: '', deliveryLeadTimeMaxDays: '',
    isStockLimited: false, stockTotalQuantity: '', stockReservedQuantity: '',
    stockSoldQuantity: '0', stockLowStockThreshold: '', stockUnit: 'item',
    status: 'draft',
  });
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

  const createCampaign = useMutation({
    mutationFn: () => campaignsApi.createCampaign({
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
      items: items.map((item) => ({
        nameAr: item.nameAr,
        nameEn: item.nameEn || undefined,
        description: item.description || undefined,
        categoryId: parseInt(item.categoryId, 10),
        unit: item.unit,
        price: parseFloat(item.price),
        stockQuantity: item.stockQuantity ? parseFloat(item.stockQuantity) : undefined,
      })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      addToast('success', 'Campaign created successfully');
      navigate(ROUTES.CAMPAIGNS);
    },
    onError: () => {
      addToast('error', 'Failed to create campaign');
    },
  });

  const handleSubmit = () => {
    if (!form.name || !form.startDate || !form.endDate) {
      addToast('error', 'Campaign name, start date, and end date are required');
      return;
    }
    if (items.some((i) => !i.nameAr || !i.categoryId || !i.unit || !i.price)) {
      addToast('error', 'Each campaign item requires name (AR), category, unit, and price');
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
        Back to Campaigns
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Megaphone size={24} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">Create Campaign</h1>
            <p className="text-sm text-text-secondary font-body">Set up a new seasonal campaign</p>
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
              <h3 className="text-sm font-bold text-text-primary font-display">Campaign Details</h3>
              <p className="text-xs text-text-secondary font-body">Basic information about the campaign</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>Campaign Name (EN) *</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} placeholder="Summer Fruits Festival" />
            </div>
            <div>
              <label className={labelClass}>Campaign Name (AR)</label>
              <input value={form.nameAr} onChange={(e) => handleChange('nameAr', e.target.value)} className={inputClass} placeholder="مهرجان الفواكه الصيفية" dir="rtl" />
            </div>
            <div>
              <label className={labelClass}>Subtitle (AR)</label>
              <input value={form.subtitleAr} onChange={(e) => handleChange('subtitleAr', e.target.value)} className={inputClass} placeholder="عروض الصيف" dir="rtl" />
            </div>
            <div>
              <label className={labelClass}>Subtitle (EN)</label>
              <input value={form.subtitleEn} onChange={(e) => handleChange('subtitleEn', e.target.value)} className={inputClass} placeholder="Summer deals" />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder="Campaign description..." />
            </div>
            <div>
              <label className={labelClass}>Description (EN)</label>
              <textarea value={form.descriptionEn} onChange={(e) => handleChange('descriptionEn', e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder="English description..." />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Target Zone</label>
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
              <h3 className="text-sm font-bold text-text-primary font-display">Schedule</h3>
              <p className="text-xs text-text-secondary font-body">Campaign timeline and ordering window</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Start Date *</label>
                <input type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>End Date *</label>
                <input type="date" value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Ordering Closes At</label>
              <input type="datetime-local" value={form.orderingClosesAt} onChange={(e) => handleChange('orderingClosesAt', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Initial Status</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className={selectClass}
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
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
              <h3 className="text-sm font-bold text-text-primary font-display">Delivery</h3>
              <p className="text-xs text-text-secondary font-body">Delivery lead time expectations</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Min Days</label>
                <input type="number" min="0" value={form.deliveryLeadTimeMinDays} onChange={(e) => handleChange('deliveryLeadTimeMinDays', e.target.value)} className={inputClass} placeholder="1" />
              </div>
              <div>
                <label className={labelClass}>Max Days</label>
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
            <h3 className="text-sm font-bold text-text-primary font-display">Stock Management</h3>
            <p className="text-xs text-text-secondary font-body">Configure campaign-level inventory limits</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-section-alt border border-border-default/60">
          <div className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="stock-toggle" checked={form.isStockLimited} onChange={(e) => setForm((prev) => ({ ...prev, isStockLimited: e.target.checked }))} className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary" />
          </div>
          <label htmlFor="stock-toggle" className="text-sm font-bold text-text-primary font-body cursor-pointer select-none">
            {form.isStockLimited ? 'Stock is limited' : 'Unlimited stock'}
          </label>
        </div>
        {form.isStockLimited && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Total Quantity</label>
              <input type="number" min="0" value={form.stockTotalQuantity} onChange={(e) => handleChange('stockTotalQuantity', e.target.value)} className={inputClass} placeholder="e.g. 1000" />
            </div>
            <div>
              <label className={labelClass}>Reserved</label>
              <input type="number" min="0" value={form.stockReservedQuantity} onChange={(e) => handleChange('stockReservedQuantity', e.target.value)} className={inputClass} placeholder="e.g. 50" />
            </div>
            <div>
              <label className={labelClass}>Already Sold</label>
              <input type="number" min="0" value={form.stockSoldQuantity} onChange={(e) => handleChange('stockSoldQuantity', e.target.value)} className={inputClass} placeholder="e.g. 200" />
            </div>
            <div>
              <label className={labelClass}>Low Stock Threshold</label>
              <input type="number" min="0" value={form.stockLowStockThreshold} onChange={(e) => handleChange('stockLowStockThreshold', e.target.value)} className={inputClass} placeholder="e.g. 100" />
            </div>
            <div>
              <label className={labelClass}>Stock Unit</label>
              <input value={form.stockUnit} onChange={(e) => handleChange('stockUnit', e.target.value)} className={inputClass} placeholder="kg, box, item" />
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
              <h3 className="text-sm font-bold text-text-primary font-display">Campaign Items</h3>
              <p className="text-xs text-text-secondary font-body">Products suppliers can bid on</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={addItem}>Add Item</Button>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-10">
            <Package size={40} className="mx-auto text-text-tertiary/40 mb-3" />
            <p className="text-sm text-text-tertiary font-body">No items added yet.</p>
            <p className="text-xs text-text-tertiary/60 font-body mt-1">Click "Add Item" to define what suppliers can bid on.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.key} className="p-5 rounded-xl border border-border-default/60 bg-white/50 hover:border-border-default transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider bg-bg-section-alt px-2.5 py-1 rounded-lg">Item #{items.indexOf(item) + 1}</span>
                  <button onClick={() => removeItem(item.key)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-tertiary hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Name (AR) *</label>
                    <input value={item.nameAr} onChange={(e) => updateItem(item.key, 'nameAr', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="اسم المنتج" dir="rtl" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Name (EN)</label>
                    <input value={item.nameEn} onChange={(e) => updateItem(item.key, 'nameEn', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="Product name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Category *</label>
                    <select value={item.categoryId} onChange={(e) => updateItem(item.key, 'categoryId', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all">
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nameEn || cat.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Unit *</label>
                    <input value={item.unit} onChange={(e) => updateItem(item.key, 'unit', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="kg, box" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Price *</label>
                    <input type="number" step="0.01" min="0" value={item.price} onChange={(e) => updateItem(item.key, 'price', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Stock Qty</label>
                    <input type="number" min="0" value={item.stockQuantity} onChange={(e) => updateItem(item.key, 'stockQuantity', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="0" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-text-secondary mb-1">Description</label>
                    <input value={item.description} onChange={(e) => updateItem(item.key, 'description', e.target.value)} className="w-full px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="Item description (optional)" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default/50">
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.CAMPAIGNS)}>Cancel</Button>
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} isLoading={createCampaign.isPending} onClick={handleSubmit}>Save Campaign</Button>
      </div>
    </div>
  );
}
