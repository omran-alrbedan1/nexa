import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Package, Save, Upload, X, Film, GripVertical } from 'lucide-react';
import { productsApi, type ProductCategory } from '../api/productsApi';
import { unitsApi, type ProductUnit } from '../api/unitsApi';
import type { ProductSource } from '@/types/marketplace';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { productKeys } from '../hooks/useProductsAdmin';
import { extractErrorMessage } from '@/lib/apiHelpers';
import { ProductVariantsSection } from '../components/ProductVariantsSection';

type CreateStep = 'info' | 'configuration' | 'review';

export function CreateProductPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((state) => state.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const resumedProductId = Number.parseInt(searchParams.get('productId') || '0', 10) || null;
  const initialStep = (searchParams.get('step') as CreateStep | null) ?? 'info';
  const [step, setStep] = useState<CreateStep>(initialStep);
  const [createdProductId, setCreatedProductId] = useState<number | null>(resumedProductId);
  const [loadingContinuation, setLoadingContinuation] = useState(Boolean(resumedProductId));
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [names, setNames] = useState<Partial<Record<TranslatedLang, string>>>({});
  const [descriptions, setDescriptions] = useState<Partial<Record<TranslatedLang, string>>>({});
  const [form, setForm] = useState({ price: '', unit: 'kg', unitId: '', stockQuantity: '', categoryIds: [] as number[], supplierId: '', source: 'supplier' as ProductSource });

  useEffect(() => {
    Promise.all([
      productsApi.getCategories().catch(() => [] as ProductCategory[]),
      productsApi.getSuppliersList().catch(() => []),
      unitsApi.list().then((data) => data.units).catch(() => [] as ProductUnit[]),
    ]).then(([categoryList, supplierList, unitList]) => { setCategories(categoryList); setSuppliers(supplierList); setUnits(unitList); });
  }, []);

  useEffect(() => {
    if (!resumedProductId) return;
    productsApi.getProduct(resumedProductId)
      .then((product) => {
        setNames({ ar: product.nameAr, en: product.name, he: product.nameHe ?? '', ru: product.nameRu ?? '' });
        setDescriptions({ ar: product.descriptionAr, en: product.descriptionEn ?? '', he: product.descriptionHe ?? '', ru: product.descriptionRu ?? '' });
        setForm({ price: String(product.price), unit: product.unit, unitId: product.unitId ? String(product.unitId) : '', stockQuantity: String(product.stockQuantity), categoryIds: product.categoryIds.length > 0 ? product.categoryIds : product.categoryId ? [product.categoryId] : [], supplierId: product.supplierId ? String(product.supplierId) : '', source: product.source });
      }).catch((error) => {
        setCreatedProductId(null);
        setStep('info');
        setSearchParams({}, { replace: true });
        addToast('error', extractErrorMessage(error));
      }).finally(() => setLoadingContinuation(false));
  }, [resumedProductId, addToast, setSearchParams]);

  const goToStep = (nextStep: CreateStep) => {
    if (!createdProductId && nextStep !== 'info') return;
    setStep(nextStep);
    if (createdProductId) setSearchParams({ productId: String(createdProductId), step: nextStep }, { replace: true });
  };
  const handleChange = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const handleUnitChange = (unitId: string) => { const unit = units.find((item) => String(item.id) === unitId); setForm((current) => ({ ...current, unitId, unit: unit ? unit.code.toLowerCase() : current.unit })); };
  const handleCategoryToggle = (catId: number) => {
    setForm((current) => {
      const ids = current.categoryIds.includes(catId)
        ? current.categoryIds.filter((id) => id !== catId)
        : [...current.categoryIds, catId];
      return { ...current, categoryIds: ids };
    });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllImages = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleRemoveVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const productPayload = () => ({
    name: names.en ?? '', nameAr: names.ar ?? '', nameHe: names.he, nameRu: names.ru,
    description: descriptions.ar ?? '', descriptionAr: descriptions.ar, descriptionEn: descriptions.en, descriptionHe: descriptions.he, descriptionRu: descriptions.ru,
    price: Number.parseFloat(form.price) || 0, unit: form.unit, unitId: form.unitId ? Number.parseInt(form.unitId, 10) : null,
    stockQuantity: Number.parseInt(form.stockQuantity, 10) || 0,
    categoryIds: form.categoryIds.length > 0 ? form.categoryIds : undefined,
    categoryId: form.categoryIds.length > 0 ? form.categoryIds[0] : undefined,
    supplierId: form.supplierId ? Number.parseInt(form.supplierId, 10) : null, source: form.source,
    imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
    videoFile: videoFile || undefined,
  });

  const saveProduct = async (): Promise<number | null> => {
    if (!names.ar?.trim() || !form.price) { addToast('error', t('products.create.validationRequired')); return null; }
    setSaving(true);
    try {
      const saved = createdProductId ? await productsApi.updateProduct(createdProductId, productPayload()) : await productsApi.createProduct(productPayload());
      const productId = createdProductId ?? saved.id;
      setCreatedProductId(productId);
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      addToast('success', createdProductId ? t('createFlow.productUpdated') : t('createFlow.productSaved'));
      return productId;
    } catch (error) { addToast('error', extractErrorMessage(error)); return null; } finally { setSaving(false); }
  };

  const saveAndContinue = async () => { const productId = await saveProduct(); if (!productId) return; setStep('configuration'); setSearchParams({ productId: String(productId), step: 'configuration' }, { replace: true }); };

  if (loadingContinuation) return <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />;
  const tabs = [
    { id: 'info', label: t('createFlow.steps.info') },
    { id: 'configuration', label: t('createFlow.steps.configuration'), disabled: !createdProductId },
    { id: 'review', label: t('createFlow.steps.review'), disabled: !createdProductId },
  ];

  return <div className="space-y-6 animate-fade-up max-w-4xl">
    <button onClick={() => navigate(ROUTES.PRODUCTS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"><ArrowLeft size={16} /> {t('products.create.back')}</button>
    <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center"><Package size={22} className="text-brand-accent" /></div><div className="flex-1"><h1 className="text-2xl font-extrabold text-text-primary">{t('products.create.title')}</h1><p className="text-sm text-text-secondary">{t('createFlow.subtitle')}</p></div>{createdProductId && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700"><CheckCircle2 size={13} />{t('createFlow.savedState')}</span>}</div></div>
    <Tabs tabs={tabs} activeTab={step} onChange={(id) => goToStep(id as CreateStep)} variant="pills" className="overflow-x-auto" />

    {step === 'info' && <>
      <Card padding="lg">
        <h3 className="text-sm font-bold text-text-primary mb-4">{t('products.create.mediaTitle')}</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-text-secondary mb-2">{t('products.create.imagesLabel')}</p>
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border-default bg-bg-input group">
                  <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute top-1 left-1 bg-brand-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Primary</span>}
                  <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                  <div className="absolute bottom-1 left-1 text-white/70"><GripVertical size={12} /></div>
                </div>
              ))}
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border-default bg-bg-input flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary transition-colors">
                <Upload size={20} className="text-text-secondary/40 mb-1" />
                <span className="text-[10px] text-text-secondary/60">{t('products.create.addImage')}</span>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageSelect} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-text-secondary/60 mt-2">{t('products.create.imageHint')}</p>
            {imagePreviews.length > 0 && (
              <button type="button" onClick={handleRemoveAllImages} className="text-xs text-red-500 hover:text-red-700 font-bold mt-1">{t('products.create.removeAllImages')}</button>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary mb-2">{t('products.create.videoLabel')}</p>
            {videoPreview ? (
              <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-border-default bg-bg-input">
                <video src={videoPreview} controls className="w-full h-48 object-cover" />
                <button type="button" onClick={handleRemoveVideo} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X size={14} /></button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border-default bg-bg-input cursor-pointer hover:border-brand-primary transition-colors">
                <Film size={24} className="text-text-secondary/40" />
                <div>
                  <p className="text-sm font-bold text-text-primary">{t('products.create.uploadVideo')}</p>
                  <p className="text-xs text-text-secondary/60">{t('products.create.videoHint')}</p>
                </div>
                <input ref={videoInputRef} type="file" accept="video/mp4,video/mov,video/webm,video/m4v" onChange={handleVideoSelect} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg"><h3 className="text-sm font-bold text-text-primary mb-5">{t('products.create.basicInfo')}</h3><div className="space-y-5"><TranslatedField label={t('products.create.name')} values={names} onChange={(key, value) => setNames({ ...names, [key]: value })} placeholder={t('products.create.namePlaceholder')} required /><TranslatedField label={t('products.create.description')} values={descriptions} onChange={(key, value) => setDescriptions({ ...descriptions, [key]: value })} placeholder={t('products.create.descriptionPlaceholder')} textarea /><FieldSelect label={t('products.create.source')} value={form.source} onChange={(value) => handleChange('source', value)} options={[['supplier', t('products.create.sourceSupplier')], ['internal', t('products.create.sourceInternal')], ['seasonal', t('products.create.sourceSeasonal')]]} /></div></Card>
        <Card padding="lg"><h3 className="text-sm font-bold text-text-primary mb-5">{t('products.create.pricingInventory')}</h3><div className="space-y-5"><FieldInput label={t('products.create.price')} type="number" value={form.price} onChange={(value) => handleChange('price', value)} /><FieldSelect label={t('products.create.unit')} value={form.unitId} onChange={handleUnitChange} options={[['', t('products.create.selectUnit')], ...units.map((unit) => [String(unit.id), `${unit.nameAr}${unit.nameEn ? ` (${unit.nameEn})` : ''} — ${unit.code}`] as [string, string])]} /><FieldInput label={t('products.create.stockQuantity')} type="number" value={form.stockQuantity} onChange={(value) => handleChange('stockQuantity', value)} /><div><label className="block text-xs font-bold text-text-secondary mb-1.5">{t('products.create.categories')} *</label><div className="space-y-1.5 max-h-40 overflow-y-auto border border-border-default rounded-lg p-2">{categories.map((category) => (<label key={category.id} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-gray-50"><input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => handleCategoryToggle(category.id)} className="accent-brand-primary" /><span className="text-sm text-text-primary">{category.name}</span></label>))}</div>{form.categoryIds.length > 0 && <p className="text-xs text-text-secondary mt-1">{t('products.create.primaryCategory')}: {categories.find((c) => c.id === form.categoryIds[0])?.name ?? '—'}</p>}</div><FieldSelect label={t('products.create.supplier')} value={form.supplierId} onChange={(value) => handleChange('supplierId', value)} options={[['', t('products.create.noSupplier')], ...suppliers.map((supplier) => [String(supplier.id), supplier.name] as [string, string])]} /></div></Card>
      </div>
      <div className="flex gap-3"><Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={saveAndContinue} isLoading={saving}>{t('createFlow.saveContinue')}</Button><Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PRODUCTS)}>{t('common.cancel')}</Button></div>
    </>}

    {step === 'configuration' && createdProductId && <>
      <ProductVariantsSection productId={createdProductId} basePrice={form.price} baseStock={form.stockQuantity} onFinish={() => goToStep('review')} />
      <Button variant="secondary" size="sm" onClick={() => goToStep('info')}>{t('createFlow.back')}</Button>
    </>}
    {step === 'review' && createdProductId && <Card padding="lg"><div className="text-center py-6"><CheckCircle2 size={42} className="mx-auto text-green-600" /><h3 className="mt-4 text-xl font-bold text-text-primary">{t('createFlow.readyTitle')}</h3><p className="mt-2 text-sm text-text-secondary">{t('createFlow.readyHint')}</p><div className="mt-6 flex justify-center gap-3"><Button variant="primary" size="sm" onClick={() => navigate(ROUTES.PRODUCT_DETAIL(createdProductId))}>{t('createFlow.finish')}</Button><Button variant="secondary" size="sm" onClick={() => goToStep('configuration')}>{t('createFlow.back')}</Button></div></div></Card>}
  </div>;
}

function FieldInput({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="block text-xs font-bold text-text-secondary mb-1.5">{label}</label><input type={type} min="0" value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm" /></div>;
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <div><label className="block text-xs font-bold text-text-secondary mb-1.5">{label}</label><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm">{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></div>;
}
