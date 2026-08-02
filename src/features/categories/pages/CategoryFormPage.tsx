import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { categoriesApi, type Category } from '../api/categoriesApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ArrowLeft, FolderTree, Save, Upload, ImageOff } from 'lucide-react';

const BASE_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

export function CategoryFormPage() {
  const { t } = useTranslation();
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!categoryId;
  const id = parseInt(categoryId || '0', 10);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    parentId: '',
    sortOrder: '0',
    isActive: true,
  });

  useEffect(() => {
    categoriesApi.list().then((res) => {
      setCategories(res.categories);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    Promise.all([
      categoriesApi.get(id),
    ]).then(([cat]) => {
      setForm({
        nameAr: cat.nameAr,
        nameEn: cat.nameEn ?? '',
        parentId: cat.parentId ? String(cat.parentId) : '',
        sortOrder: String(cat.sortOrder),
        isActive: cat.isActive,
      });
      if (cat.image) {
        setExistingImageUrl(cat.image.startsWith('http') ? cat.image : `${BASE_URL}/storage/${cat.image}`);
      }
    }).catch((err) => {
      setError(err?.response?.data?.message || t('categories.form.errorLoading'));
    }).finally(() => setLoading(false));
  }, [isEdit, id]);

  const handleChange = (field: string, value: string | boolean) => {
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
    if (!form.nameAr.trim()) {
      addToast('error', t('categories.form.validationRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name_ar: form.nameAr,
        name_en: form.nameEn || undefined,
        parent_id: form.parentId ? Number(form.parentId) : null,
        sort_order: parseInt(form.sortOrder) || 0,
        is_active: form.isActive,
        image: imageFile || undefined,
      };

      if (isEdit) {
        await categoriesApi.update(id, payload);
        addToast('success', t('categories.form.updateSuccess'));
      } else {
        await categoriesApi.create(payload);
        addToast('success', t('categories.form.createSuccess'));
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      navigate(ROUTES.CATEGORIES);
    } catch (err: any) {
      addToast('error', err?.response?.data?.message || (isEdit ? t('categories.form.updateFailed') : t('categories.form.createFailed')));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-up max-w-4xl">
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-up">
        <ErrorState title={t('categories.form.errorTitle')} message={error} onRetry={() => navigate(ROUTES.CATEGORIES)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button onClick={() => navigate(ROUTES.CATEGORIES)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('categories.form.back')}
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <FolderTree size={22} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">{isEdit ? t('categories.form.editTitle') : t('categories.form.addTitle')}</h1>
            <p className="text-sm text-text-secondary font-body">{isEdit ? t('categories.form.editDescription') : t('categories.form.addDescription')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-5">{t('categories.form.basicInfo')}</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('categories.form.nameAr')}</label>
              <input
                value={form.nameAr}
                onChange={(e) => handleChange('nameAr', e.target.value)}
                className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
                placeholder={t('categories.form.nameArPlaceholder')}
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('categories.form.nameEn')}</label>
              <input
                value={form.nameEn}
                onChange={(e) => handleChange('nameEn', e.target.value)}
                className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
                placeholder={t('categories.form.namePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('categories.form.parentCategory')}</label>
              <select
                value={form.parentId}
                onChange={(e) => handleChange('parentId', e.target.value)}
                className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
              >
                <option value="">{t('categories.form.noneTopLevel')}</option>
                {categories
                  .filter((c) => !isEdit || c.id !== id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}{c.nameEn ? ` (${c.nameEn})` : ''}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('categories.form.sortOrder')}</label>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => handleChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('categories.form.active')}</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary/30 rounded-full peer-checked:bg-brand-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-5">{t('categories.form.categoryImage')}</h3>
          <div className="space-y-4">
            <div className="w-full h-44 rounded-xl overflow-hidden border border-border-default bg-bg-input flex items-center justify-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
              ) : existingImageUrl ? (
                <img src={existingImageUrl} alt="Current" className="w-full h-full object-contain" />
              ) : (
                <ImageOff size={40} className="text-text-secondary/40" />
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" leftIcon={<Upload size={14} />} onClick={() => fileInputRef.current?.click()}>
                {imagePreview || existingImageUrl ? t('categories.form.changeImage') : t('categories.form.uploadImage')}
              </Button>
              {(imagePreview || existingImageUrl) && (
                <Button variant="ghost" size="sm" onClick={handleRemoveImage}>{t('categories.form.remove')}</Button>
              )}
            </div>
            <p className="text-xs text-text-secondary/60">{t('categories.form.imageFormatHint')}</p>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSubmit} isLoading={saving}>
          {isEdit ? t('categories.form.saveChanges') : t('categories.form.createCategory')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.CATEGORIES)}>{t('categories.form.cancel')}</Button>
      </div>
    </div>
  );
}
