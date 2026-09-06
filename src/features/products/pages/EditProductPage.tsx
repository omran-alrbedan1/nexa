import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { productsApi, type ProductCategory, type ProductImage } from '../api/productsApi';
import { unitsApi, type ProductUnit } from '../api/unitsApi';
import type { ProductSource } from '@/types/marketplace';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ArrowLeft, Package, Save, Upload, ImageOff, X, Film, GripVertical } from 'lucide-react';
import { productKeys } from '../hooks/useProductsAdmin';
import { extractErrorMessage } from '@/lib/apiHelpers';
import { ProductVariantsSection } from '../components/ProductVariantsSection';

export function EditProductPage() {
  const { t } = useTranslation();
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const id = parseInt(productId || '0', 10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [names, setNames] = useState<Partial<Record<TranslatedLang, string>>>({});
  const [descriptions, setDescriptions] = useState<Partial<Record<TranslatedLang, string>>>({});
  const [form, setForm] = useState({
    price: '', unit: 'kg', unitId: '', stockQuantity: '',
    categoryIds: [] as number[], supplierId: '', source: 'supplier' as ProductSource,
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      productsApi.getProduct(id),
      productsApi.getCategories().catch(() => [] as ProductCategory[]),
      productsApi.getSuppliersList().catch(() => []),
      unitsApi.list().then((d) => d.units).catch(() => [] as ProductUnit[]),
    ]).then(([p, cats, supps, unitList]) => {
      setNames({ ar: p.nameAr, en: p.name, he: p.nameHe ?? '', ru: p.nameRu ?? '' });
      setDescriptions({ ar: p.descriptionAr, en: p.descriptionEn ?? '', he: p.descriptionHe ?? '', ru: p.descriptionRu ?? '' });
      setForm({
        price: String(p.price), unit: p.unit, unitId: p.unitId ? String(p.unitId) : '',
        stockQuantity: String(p.stockQuantity),
        categoryIds: p.categoryIds.length > 0 ? p.categoryIds : p.categoryId ? [p.categoryId] : [],
        supplierId: p.supplierId ? String(p.supplierId) : '',
        source: p.source,
      });
      setExistingImages(p.images || []);
      setExistingVideoUrl(p.videoUrl || null);
      setCategories(cats);
      setSuppliers(supps);
      setUnits(unitList);
    }).catch((e) => {
      setError(e.message);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (catId: number) => {
    setForm((prev) => {
      const ids = prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId];
      return { ...prev, categoryIds: ids };
    });
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
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setRemoveVideo(false);
  };

  const handleRemoveVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    if (existingVideoUrl) setRemoveVideo(true);
    if (videoInputRef.current) videoInputRef.current.value = '';
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
        categoryId: form.categoryIds[0] || 1,
        categoryIds: form.categoryIds.length > 0 ? form.categoryIds : undefined,
        supplierId: form.supplierId ? parseInt(form.supplierId) : null,
        source: form.source,
        imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
        videoFile: videoFile || undefined,
        removeVideo: removeVideo || undefined,
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
        <h3 className="text-sm font-bold text-text-primary font-display mb-4">{t('products.edit.mediaTitle')}</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-text-secondary mb-2">{t('products.edit.imagesLabel')}</p>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img, i) => (
                <div key={img.id} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border-default bg-bg-input group">
                  <img src={img.url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                  {img.is_primary && <span className="absolute top-1 left-1 bg-brand-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Primary</span>}
                  <div className="absolute bottom-1 left-1 text-white/70"><GripVertical size={12} /></div>
                </div>
              ))}
              {imagePreviews.map((preview, i) => (
                <div key={`new-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-brand-primary bg-bg-input group">
                  <img src={preview} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute top-1 left-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">New</span>
                  <button type="button" onClick={() => handleRemoveNewImage(i)} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border-default bg-bg-input flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary transition-colors">
                <Upload size={20} className="text-text-secondary/40 mb-1" />
                <span className="text-[10px] text-text-secondary/60">{t('products.edit.addImage')}</span>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageSelect} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-text-secondary/60 mt-2">{t('products.edit.imageHint')}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary mb-2">{t('products.edit.videoLabel')}</p>
            {videoPreview ? (
              <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-border-default bg-bg-input">
                <video src={videoPreview} controls className="w-full h-48 object-cover" />
                <button type="button" onClick={handleRemoveVideo} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X size={14} /></button>
              </div>
            ) : existingVideoUrl && !removeVideo ? (
              <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-border-default bg-bg-input">
                <video src={existingVideoUrl} controls className="w-full h-48 object-cover" />
                <button type="button" onClick={handleRemoveVideo} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X size={14} /></button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border-default bg-bg-input cursor-pointer hover:border-brand-primary transition-colors">
                <Film size={24} className="text-text-secondary/40" />
                <div>
                  <p className="text-sm font-bold text-text-primary">{t('products.edit.uploadVideo')}</p>
                  <p className="text-xs text-text-secondary/60">{t('products.edit.videoHint')}</p>
                </div>
                <input ref={videoInputRef} type="file" accept="video/mp4,video/mov,video/webm,video/m4v" onChange={handleVideoSelect} className="hidden" />
              </label>
            )}
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
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.edit.categories')} *</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto border border-border-default rounded-lg p-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-gray-50">
                    <input type="checkbox" checked={form.categoryIds.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id)} className="accent-brand-primary" />
                    <span className="text-sm text-text-primary">{cat.name}</span>
                  </label>
                ))}
              </div>
              {form.categoryIds.length > 0 && <p className="text-xs text-text-secondary mt-1">{t('products.edit.primaryCategory')}: {categories.find((c) => c.id === form.categoryIds[0])?.name ?? '—'}</p>}
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

      <ProductVariantsSection productId={id} basePrice={form.price} baseStock={form.stockQuantity} />

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSubmit} isLoading={saving}>{t('products.edit.saveChanges')}</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PRODUCT_DETAIL(id))}>{t('products.edit.cancel')}</Button>
      </div>
    </div>
  );
}
