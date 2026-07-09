import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { productsApi, type ProductCategory } from '../api/productsApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ArrowLeft, Package, Save, Upload, ImageOff } from 'lucide-react';
import { productKeys } from '../hooks/useProductsAdmin';

export function EditProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const id = parseInt(productId || '0', 10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', nameAr: '', description: '', descriptionAr: '',
    price: '', unit: 'kg', stockQuantity: '',
    categoryId: '', supplierId: '', source: 'supplier',
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      productsApi.getProduct(id),
      productsApi.getCategories().catch(() => [] as ProductCategory[]),
      productsApi.getSuppliersList().catch(() => []),
    ]).then(([p, cats, supps]) => {
      setForm({
        name: p.name, nameAr: p.nameAr, description: p.description,
        descriptionAr: p.descriptionAr, price: String(p.price), unit: p.unit,
        stockQuantity: String(p.stockQuantity), categoryId: String(p.categoryId),
        supplierId: p.supplierId ? String(p.supplierId) : '',
        source: p.source,
      });
      setExistingImageUrl(p.imageUrl);
      setCategories(cats);
      setSuppliers(supps);
    }).catch((e) => {
      setError(e.message);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      addToast('error', 'Product name and price are required');
      return;
    }
    setSaving(true);
    try {
      await productsApi.updateProduct(id, {
        name: form.name, nameAr: form.nameAr, description: form.description,
        descriptionAr: form.descriptionAr, price: parseFloat(form.price) || 0,
        unit: form.unit, stockQuantity: parseInt(form.stockQuantity) || 0,
        categoryId: parseInt(form.categoryId) || 1,
        supplierId: form.supplierId ? parseInt(form.supplierId) : null,
        source: form.source as any,
        image: imageFile || undefined,
      });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      addToast('success', 'Product updated successfully');
      navigate(ROUTES.PRODUCT_DETAIL(id));
    } catch {
      addToast('error', 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-up max-w-4xl">
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-5">
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState title="Failed to load product" message={error} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button onClick={() => navigate(ROUTES.PRODUCT_DETAIL(id))} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Product
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Package size={22} className="text-brand-accent" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-text-primary font-display">Edit Product</h1>
            <p className="text-sm text-text-secondary font-body">{form.name}</p>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <h3 className="text-sm font-bold text-text-primary font-display mb-4">Product Image</h3>
        <div className="flex items-start gap-5">
          <div className="w-28 h-28 rounded-xl overflow-hidden border border-border-default bg-bg-input flex items-center justify-center flex-shrink-0">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : existingImageUrl ? (
              <img src={existingImageUrl} alt="Current" className="w-full h-full object-cover" />
            ) : (
              <ImageOff size={28} className="text-text-secondary/40" />
            )}
          </div>
          <div className="space-y-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <Button variant="secondary" size="sm" leftIcon={<Upload size={14} />} onClick={() => fileInputRef.current?.click()}>
              {existingImageUrl || imagePreview ? 'Change Image' : 'Upload Image'}
            </Button>
            {(imagePreview || existingImageUrl) && (
              <Button variant="ghost" size="sm" onClick={handleRemoveImage}>Remove</Button>
            )}
            <p className="text-xs text-text-secondary/60">JPG, PNG, or WebP. Max 2MB.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-5">Basic Information</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Product Name (EN) *</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Product Name (AR)</label>
              <input value={form.nameAr} onChange={(e) => handleChange('nameAr', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Description (EN)</label>
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Description (AR)</label>
              <textarea value={form.descriptionAr} onChange={(e) => handleChange('descriptionAr', e.target.value)} rows={3} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary resize-none" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Source</label>
              <select value={form.source} onChange={(e) => handleChange('source', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="supplier">Supplier</option>
                <option value="internal">Internal</option>
                <option value="seasonal">Seasonal</option>
              </select>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-5">Pricing & Inventory</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Price *</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => handleChange('price', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Unit</label>
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
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Stock Quantity</label>
              <input type="number" min="0" value={form.stockQuantity} onChange={(e) => handleChange('stockQuantity', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Category</label>
              <select value={form.categoryId} onChange={(e) => handleChange('categoryId', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Supplier</label>
              <select value={form.supplierId} onChange={(e) => handleChange('supplierId', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="">No supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSubmit} isLoading={saving}>Save Changes</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PRODUCT_DETAIL(id))}>Cancel</Button>
      </div>
    </div>
  );
}