import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { campaignsApi } from '../api/campaignsApi';
import { categoriesApi, type Category } from '@/features/categories/api/categoriesApi';
import { ArrowLeft, Megaphone, Save, Plus, X, Package } from 'lucide-react';

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

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button onClick={() => navigate(ROUTES.CAMPAIGNS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Campaigns
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Megaphone size={22} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">Create Campaign</h1>
            <p className="text-sm text-text-secondary font-body">Set up a new seasonal campaign</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">Campaign Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Campaign Name (EN) *</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="Summer Fruits Festival" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Campaign Name (AR)</label>
              <input value={form.nameAr} onChange={(e) => handleChange('nameAr', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="مهرجان الفواكه الصيفية" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Subtitle (AR)</label>
              <input value={form.subtitleAr} onChange={(e) => handleChange('subtitleAr', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="عروض الصيف" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Subtitle (EN)</label>
              <input value={form.subtitleEn} onChange={(e) => handleChange('subtitleEn', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="Summer deals" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={2} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary resize-none" placeholder="Campaign description..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Description (EN)</label>
              <textarea value={form.descriptionEn} onChange={(e) => handleChange('descriptionEn', e.target.value)} rows={2} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary resize-none" placeholder="English description..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Target Zone</label>
              <select value={form.targetRegion} onChange={(e) => handleChange('targetRegion', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                {(zones || []).map((z) => (
                  <option key={z.id} value={z.id}>{z.name_en || z.name_ar}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">Schedule &amp; Delivery</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">End Date *</label>
              <input type="date" value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Ordering Closes At</label>
              <input type="datetime-local" value={form.orderingClosesAt} onChange={(e) => handleChange('orderingClosesAt', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Delivery Lead Time (Min Days)</label>
                <input type="number" min="0" value={form.deliveryLeadTimeMinDays} onChange={(e) => handleChange('deliveryLeadTimeMinDays', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="1" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Delivery Lead Time (Max Days)</label>
                <input type="number" min="0" value={form.deliveryLeadTimeMaxDays} onChange={(e) => handleChange('deliveryLeadTimeMaxDays', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="3" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Initial Status</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Management */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-brand-accent" />
          <h3 className="text-sm font-bold text-text-primary font-display">Stock Management</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isStockLimited} onChange={(e) => setForm((prev) => ({ ...prev, isStockLimited: e.target.checked }))} className="w-4 h-4 rounded border-border-default text-brand-primary focus:ring-brand-primary" />
              <span className="text-sm font-body text-text-primary">Limit stock</span>
            </label>
          </div>
          {form.isStockLimited && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Total Quantity *</label>
                <input type="number" min="0" value={form.stockTotalQuantity} onChange={(e) => handleChange('stockTotalQuantity', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="1000" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Reserved</label>
                <input type="number" min="0" value={form.stockReservedQuantity} onChange={(e) => handleChange('stockReservedQuantity', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Already Sold</label>
                <input type="number" min="0" value={form.stockSoldQuantity} onChange={(e) => handleChange('stockSoldQuantity', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Low Stock Threshold</label>
                <input type="number" min="0" value={form.stockLowStockThreshold} onChange={(e) => handleChange('stockLowStockThreshold', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="100" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Stock Unit</label>
                <input value={form.stockUnit} onChange={(e) => handleChange('stockUnit', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="kg, box, item" />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Campaign Items */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-text-primary font-display">Campaign Items</h3>
          <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={addItem}>Add Item</Button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-text-tertiary font-body">No items added yet. Click "Add Item" to define items suppliers can bid on.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.key} className="p-4 rounded-xl border border-border-default/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Item #{items.indexOf(item) + 1}</span>
                  <button onClick={() => removeItem(item.key)} className="p-1 rounded-lg hover:bg-red-50 text-text-tertiary hover:text-red-500 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Name (AR) *</label>
                    <input value={item.nameAr} onChange={(e) => updateItem(item.key, 'nameAr', e.target.value)} className="w-full px-2 py-1.5 bg-bg-input border border-border-default rounded text-xs outline-none focus:border-brand-primary" placeholder="اسم المنتج" dir="rtl" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Name (EN)</label>
                    <input value={item.nameEn} onChange={(e) => updateItem(item.key, 'nameEn', e.target.value)} className="w-full px-2 py-1.5 bg-bg-input border border-border-default rounded text-xs outline-none focus:border-brand-primary" placeholder="Product name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Category *</label>
                    <select value={item.categoryId} onChange={(e) => updateItem(item.key, 'categoryId', e.target.value)} className="w-full px-2 py-1.5 bg-bg-input border border-border-default rounded text-xs outline-none focus:border-brand-primary">
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nameEn || cat.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Unit *</label>
                    <input value={item.unit} onChange={(e) => updateItem(item.key, 'unit', e.target.value)} className="w-full px-2 py-1.5 bg-bg-input border border-border-default rounded text-xs outline-none focus:border-brand-primary" placeholder="kg, box, etc." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Price *</label>
                    <input type="number" step="0.01" min="0" value={item.price} onChange={(e) => updateItem(item.key, 'price', e.target.value)} className="w-full px-2 py-1.5 bg-bg-input border border-border-default rounded text-xs outline-none focus:border-brand-primary" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Stock Qty</label>
                    <input type="number" min="0" value={item.stockQuantity} onChange={(e) => updateItem(item.key, 'stockQuantity', e.target.value)} className="w-full px-2 py-1.5 bg-bg-input border border-border-default rounded text-xs outline-none focus:border-brand-primary" placeholder="0" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-text-secondary mb-1">Description</label>
                    <input value={item.description} onChange={(e) => updateItem(item.key, 'description', e.target.value)} className="w-full px-2 py-1.5 bg-bg-input border border-border-default rounded text-xs outline-none focus:border-brand-primary" placeholder="Item description (optional)" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} isLoading={createCampaign.isPending} onClick={handleSubmit}>Save Campaign</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.CAMPAIGNS)}>Cancel</Button>
      </div>
    </div>
  );
}
