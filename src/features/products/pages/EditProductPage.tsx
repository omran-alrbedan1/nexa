import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { productsApi, productVariantsApi, type ProductCategory } from '../api/productsApi';
import { unitsApi, type ProductUnit } from '../api/unitsApi';
import type { ProductSource, ProductVariantType } from '@/types/marketplace';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';
import { VariantEditor, type VariantDraft } from '../components/VariantEditor';
import { ColorSizeManagementSection } from '../components/ColorSizeManagementSection';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ArrowLeft, Package, Palette, Save, Upload, ImageOff } from 'lucide-react';
import { productKeys } from '../hooks/useProductsAdmin';
import { useEnableColorSize, useProductColors } from '../hooks/useProductColors';
import { extractErrorMessage } from '@/lib/apiHelpers';

export function EditProductPage() {
  const { t } = useTranslation();
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
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [productSku, setProductSku] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [names, setNames] = useState<Partial<Record<TranslatedLang, string>>>({});
  const [descriptions, setDescriptions] = useState<Partial<Record<TranslatedLang, string>>>({});
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [variantType, setVariantType] = useState<ProductVariantType>('unit');
  const [form, setForm] = useState({
    price: '', unit: 'kg', unitId: '', stockQuantity: '',
    categoryId: '', supplierId: '', source: 'supplier' as ProductSource,
  });
  const enableColorSizeMutation = useEnableColorSize(id);
  const productColorsQuery = useProductColors(id);
  const productColors = productColorsQuery.data ?? [];

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      productsApi.getProduct(id),
      productVariantsApi.list(id).catch(() => []),
      productsApi.getCategories().catch(() => [] as ProductCategory[]),
      productsApi.getSuppliersList().catch(() => []),
      unitsApi.list().then((d) => d.units).catch(() => [] as ProductUnit[]),
    ]).then(([p, variantList, cats, supps, unitList]) => {
      setNames({ ar: p.nameAr, en: p.name, he: p.nameHe ?? '', ru: p.nameRu ?? '' });
      setDescriptions({ ar: p.descriptionAr, en: p.descriptionEn ?? '', he: p.descriptionHe ?? '', ru: p.descriptionRu ?? '' });
      setVariants(variantList.map((v) => ({
        id: v.id,
        unit_id: v.unit_id ?? undefined,
        color_id: v.color_id ?? undefined,
        name_ar: v.name_ar,
        name_en: v.name_en ?? undefined,
        name_he: v.name_he ?? undefined,
        name_ru: v.name_ru ?? undefined,
        sku: v.sku ?? undefined,
        price: v.price,
        stock_quantity: v.stock_quantity,
        is_active: v.is_active,
      })));
      setForm({
        price: String(p.price), unit: p.unit, unitId: p.unitId ? String(p.unitId) : '',
        stockQuantity: String(p.stockQuantity), categoryId: String(p.categoryId),
        supplierId: p.supplierId ? String(p.supplierId) : '',
        source: p.source,
      });
      setExistingImageUrl(p.imageUrl);
      setCategories(cats);
      setSuppliers(supps);
      setUnits(unitList);
      setProductSku(p.sku);
      setVariantType(p.variantType);
    }).catch((e) => {
      setError(e.message);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUnitChange = (unitId: string) => {
    const unit = units.find((u) => String(u.id) === unitId);
    setForm((prev) => ({
      ...prev,
      unitId,
      unit: unit ? unit.code.toLowerCase() : prev.unit,
    }));
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
      addToast('error', t('products.edit.validationRequired'));
      return;
    }
    setSaving(true);
    try {
      await productsApi.updateProduct(id, {
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
        unitId: form.unitId ? parseInt(form.unitId) : null,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        categoryId: parseInt(form.categoryId) || 1,
        supplierId: form.supplierId ? parseInt(form.supplierId) : null,
        source: form.source,
        // Unit/color variants are persisted here; color × unit matrix is managed via its own endpoints.
        variants: variants.length > 0 ? variants : undefined,
        image: imageFile || undefined,
      });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      addToast('success', t('products.edit.successMessage'));
      navigate(ROUTES.PRODUCT_DETAIL(id));
    } catch (error) {
      addToast('error', extractErrorMessage(error));
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
      <ErrorState title={t('products.edit.errorTitle')} message={error} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button onClick={() => navigate(ROUTES.PRODUCT_DETAIL(id))} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('products.edit.back')}
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Package size={22} className="text-brand-accent" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('products.edit.title')}</h1>
            <p className="text-sm text-text-secondary font-body">{names.ar}</p>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <h3 className="text-sm font-bold text-text-primary font-display mb-4">{t('products.edit.productImage')}</h3>
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
              {existingImageUrl || imagePreview ? t('products.edit.changeImage') : t('products.edit.uploadImage')}
            </Button>
            {(imagePreview || existingImageUrl) && (
              <Button variant="ghost" size="sm" onClick={handleRemoveImage}>{t('products.edit.remove')}</Button>
            )}
            <p className="text-xs text-text-secondary/60">{t('products.edit.imageFormatHint')}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-5">{t('products.edit.basicInfo')}</h3>
          <div className="space-y-5">
            <TranslatedField
              label={t('products.edit.name')}
              values={names}
              onChange={(key, value) => setNames({ ...names, [key]: value })}
              placeholder={t('products.edit.namePlaceholder')}
              required
            />
            <TranslatedField
              label={t('products.edit.description')}
              values={descriptions}
              onChange={(key, value) => setDescriptions({ ...descriptions, [key]: value })}
              placeholder={t('products.edit.descriptionPlaceholder')}
              textarea
            />
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.edit.source')}</label>
              <select value={form.source} onChange={(e) => handleChange('source', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="supplier">{t('products.edit.supplierOption')}</option>
                <option value="internal">{t('products.edit.internalOption')}</option>
                <option value="seasonal">{t('products.edit.seasonalOption')}</option>
              </select>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-5">{t('products.edit.pricingInventory')}</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.edit.price')}</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => handleChange('price', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.edit.unit')}</label>
              <select value={form.unitId} onChange={(e) => handleUnitChange(e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="">{t('products.edit.selectUnit')}</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.nameAr}{unit.nameEn ? ` (${unit.nameEn})` : ''} — {unit.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.edit.stockQuantity')}</label>
              <input type="number" min="0" value={form.stockQuantity} onChange={(e) => handleChange('stockQuantity', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.edit.category')}</label>
              <select value={form.categoryId} onChange={(e) => handleChange('categoryId', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="">{t('products.edit.selectCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.edit.supplier')}</label>
              <select value={form.supplierId} onChange={(e) => handleChange('supplierId', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="">{t('products.edit.noSupplier')}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="mb-5 flex flex-col gap-3 border-b border-border-default pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-teal-50 p-2.5 text-teal-600"><Palette size={18} /></span>
            <div><h3 className="text-sm font-bold text-text-primary">{t('products.variants.title')}</h3><p className="text-xs text-text-secondary mt-1">{t('products.variants.manageHint')}</p></div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => enableColorSizeMutation.mutate(undefined, { onSuccess: () => setVariantType('color_size') })} isLoading={enableColorSizeMutation.isPending}>{t('colorSize.enable')}</Button>
        </div>
        <VariantEditor
          value={variants}
          onChange={setVariants}
          units={units}
          colors={productColors}
          productNames={names}
          productSku={productSku}
        />
      </Card>

      <ColorSizeManagementSection productId={id} basePrice={form.price} baseStock={form.stockQuantity} onDisabled={() => setVariantType('unit')} />

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSubmit} isLoading={saving}>{t('products.edit.saveChanges')}</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PRODUCT_DETAIL(id))}>{t('products.edit.cancel')}</Button>
      </div>
    </div>
  );
}
