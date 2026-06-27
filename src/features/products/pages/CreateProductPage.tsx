import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { productKeys } from '../hooks/useProductsAdmin';

export function CreateProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', nameAr: '', description: '', descriptionAr: '',
    price: '', unit: 'kg', stockQuantity: '',
    categoryId: '', supplierId: '', source: 'supplier',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      addToast('error', 'Product name and price are required');
      return;
    }
    setSaving(true);
    try {
      await productsApi.createProduct({
        name: form.name,
        nameAr: form.nameAr,
        description: form.description,
        descriptionAr: form.descriptionAr,
        price: parseFloat(form.price) || 0,
        unit: form.unit,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        categoryId: parseInt(form.categoryId) || 1,
        source: form.source as 'supplier' | 'internal' | 'seasonal',
      });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      addToast('success', 'Product created successfully');
      navigate(ROUTES.PRODUCTS);
    } catch {
      addToast('error', 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button onClick={() => navigate(ROUTES.PRODUCTS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Products
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Package size={22} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">Add Product</h1>
            <p className="text-sm text-text-secondary font-body">Create a new product in the catalog</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Product Name (EN) *</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="e.g. Fresh Tomatoes" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Product Name (AR)</label>
              <input value={form.nameAr} onChange={(e) => handleChange('nameAr', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="طماطم طازجة" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Description (EN)</label>
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary resize-none" placeholder="Product description..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Description (AR)</label>
              <textarea value={form.descriptionAr} onChange={(e) => handleChange('descriptionAr', e.target.value)} rows={3} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary resize-none" placeholder="وصف المنتج..." dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Source</label>
              <select value={form.source} onChange={(e) => handleChange('source', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="supplier">Supplier</option>
                <option value="internal">Internal</option>
                <option value="seasonal">Seasonal</option>
              </select>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">Pricing & Inventory</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Price (SAR) *</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => handleChange('price', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Unit</label>
              <select value={form.unit} onChange={(e) => handleChange('unit', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="kg">Kilogram (kg)</option>
                <option value="piece">Piece</option>
                <option value="pack">Pack</option>
                <option value="box">Box</option>
                <option value="loaf">Loaf</option>
                <option value="jar">Jar</option>
                <option value="tub">Tub</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Stock Quantity</label>
              <input type="number" min="0" value={form.stockQuantity} onChange={(e) => handleChange('stockQuantity', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Category ID</label>
              <input type="number" min="0" value={form.categoryId} onChange={(e) => handleChange('categoryId', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="1" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSubmit} isLoading={saving}>Save Product</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PRODUCTS)}>Cancel</Button>
      </div>
    </div>
  );
}
