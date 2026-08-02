import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { productsApi, type ProductCategory } from '../api/productsApi';
import type { ProductSource } from '@/types/marketplace';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';
import { VariantEditor, type VariantDraft } from '../components/VariantEditor';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ArrowLeft, Package, Save, Upload, ImageOff } from 'lucide-react';
import { productKeys } from '../hooks/useProductsAdmin';
import { extractErrorMessage } from '@/lib/apiHelpers';

export function CreateProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [names, setNames] = useState<Partial<Record<TranslatedLang, string>>>({});
  const [descriptions, setDescriptions] = useState<Partial<Record<TranslatedLang, string>>>({});
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [form, setForm] = useState({
    price: '', unit: 'kg', stockQuantity: '',
    categoryId: '', supplierId: '', source: 'supplier' as ProductSource,
  });

  useEffect(() => {
    Promise.all([
      productsApi.getCategories().catch(() => [] as ProductCategory[]),
      productsApi.getSuppliersList().catch(() => []),
    ]).then(([cats, supps]) => {
      setCategories(cats);
      setSuppliers(supps);
    });
  }, []);

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
    if (!names.ar?.trim() || !form.price) {
      addToast('error', t('products.create.validationRequired'));
      return;
    }
    setSaving(true);
    try {
      await productsApi.createProduct({
        name: names.en ?? '',
        nameAr: names.ar ?? '',
        nameHe: names.he,
        nameRu: names.ru,
        description: descriptions.ar ?? '',
        descriptionAr: descriptions.ar,
        descriptionEn: descriptions.en,
        descriptionHe: descriptions.he,
        descriptionRu: descriptions.ru,
        price: parseFloat(form.price) || 0,
        unit: form.unit,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        categoryId: parseInt(form.categoryId) || 1,
        supplierId: form.supplierId ? parseInt(form.supplierId) : null,
        source: form.source,
        variants: variants.length > 0 ? variants : undefined,
        image: imageFile || undefined,
      });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      addToast('success', t('products.create.successMessage'));
      navigate(ROUTES.PRODUCTS);
    } catch (error) {
      addToast('error', extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button onClick={() => navigate(ROUTES.PRODUCTS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('products.create.back')}
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Package size={22} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('products.create.title')}</h1>
            <p className="text-sm text-text-secondary font-body">{t('products.create.subtitle')}</p>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <h3 className="text-sm font-bold text-text-primary font-display mb-4">{t('products.create.imageTitle')}</h3>
        <div className="flex items-start gap-5">
          <div className="w-28 h-28 rounded-xl overflow-hidden border border-border-default bg-bg-input flex items-center justify-center flex-shrink-0">
            {imagePreview ? (
              <img src={imagePreview} alt={t('products.create.preview')} className="w-full h-full object-cover" />
            ) : (
              <ImageOff size={28} className="text-text-secondary/40" />
            )}
          </div>
          <div className="space-y-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <Button variant="secondary" size="sm" leftIcon={<Upload size={14} />} onClick={() => fileInputRef.current?.click()}>
              {imagePreview ? t('products.create.changeImage') : t('products.create.uploadImage')}
            </Button>
            {imagePreview && (
              <Button variant="ghost" size="sm" onClick={handleRemoveImage}>{t('products.create.removeImage')}</Button>
            )}
            <p className="text-xs text-text-secondary/60">{t('products.create.imageHint')}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-5">{t('products.create.basicInfo')}</h3>
          <div className="space-y-5">
            <TranslatedField
              label={t('products.create.name')}
              values={names}
              onChange={(key, value) => setNames({ ...names, [key]: value })}
              placeholder={t('products.create.namePlaceholder')}
              required
            />
            <TranslatedField
              label={t('products.create.description')}
              values={descriptions}
              onChange={(key, value) => setDescriptions({ ...descriptions, [key]: value })}
              placeholder={t('products.create.descriptionPlaceholder')}
              textarea
            />
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.create.source')}</label>
              <select value={form.source} onChange={(e) => handleChange('source', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="supplier">{t('products.create.sourceSupplier')}</option>
                <option value="internal">{t('products.create.sourceInternal')}</option>
                <option value="seasonal">{t('products.create.sourceSeasonal')}</option>
              </select>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-5">{t('products.create.pricingInventory')}</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.create.price')}</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => handleChange('price', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.create.unit')}</label>
              <select value={form.unit} onChange={(e) => handleChange('unit', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="kg">{t('products.create.unitKg')}</option>
                <option value="piece">{t('products.create.unitPiece')}</option>
                <option value="pack">{t('products.create.unitPack')}</option>
                <option value="box">{t('products.create.unitBox')}</option>
                <option value="loaf">{t('products.create.unitLoaf')}</option>
                <option value="jar">{t('products.create.unitJar')}</option>
                <option value="tub">{t('products.create.unitTub')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.create.stockQuantity')}</label>
              <input type="number" min="0" value={form.stockQuantity} onChange={(e) => handleChange('stockQuantity', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.create.category')}</label>
              <select value={form.categoryId} onChange={(e) => handleChange('categoryId', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="">{t('products.create.selectCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.create.supplier')}</label>
              <select value={form.supplierId} onChange={(e) => handleChange('supplierId', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="">{t('products.create.noSupplier')}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <VariantEditor value={variants} onChange={setVariants} />
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSubmit} isLoading={saving}>{t('products.create.save')}</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PRODUCTS)}>{t('common.cancel')}</Button>
      </div>
    </div>
  );
}
