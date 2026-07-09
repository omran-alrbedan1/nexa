import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { businessCategoriesApi, slugify } from '../api/businessCategoriesApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ArrowLeft, Building2, Save, Hash, Info } from 'lucide-react';

export function BusinessCategoryFormPage() {
  const { businessCategoryId } = useParams<{ businessCategoryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const isEdit = !!businessCategoryId;
  const id = parseInt(businessCategoryId || '0', 10);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    code: '',
    sortOrder: '0',
    isActive: true,
  });

  const [suppliersCount, setSuppliersCount] = useState(0);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    businessCategoriesApi.get(id)
      .then((cat) => {
        setForm({
          nameAr: cat.nameAr,
          nameEn: cat.nameEn ?? '',
          code: cat.code,
          sortOrder: String(cat.sortOrder),
          isActive: cat.isActive,
        });
        setSuppliersCount(cat.suppliersCount);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load business category');
      })
      .finally(() => setLoading(false));
  }, [isEdit, id]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'nameEn') {
        updated.code = slugify(value as string);
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!form.nameAr.trim()) {
      addToast('error', 'Arabic name is required');
      return;
    }
    if (!form.nameEn.trim()) {
      addToast('error', 'English name is required');
      return;
    }
    if (!form.code) {
      addToast('error', 'Code could not be generated from English name');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        name_ar: form.nameAr,
        name_en: form.nameEn,
        sort_order: parseInt(form.sortOrder) || 0,
        is_active: form.isActive,
      };

      if (isEdit) {
        await businessCategoriesApi.update(id, payload);
        addToast('success', 'Business category updated successfully');
      } else {
        await businessCategoriesApi.create(payload);
        addToast('success', 'Business category created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['business-categories'] });
      navigate(ROUTES.CATEGORIES + '?tab=business');
    } catch (err: any) {
      addToast('error', err?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} business category`);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => navigate(ROUTES.CATEGORIES + '?tab=business');

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
        <ErrorState title="Error" message={error} onRetry={handleBack} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Categories
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Building2 size={22} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">{isEdit ? 'Edit Business Category' : 'Add Business Category'}</h1>
            <p className="text-sm text-text-secondary font-body">{isEdit ? 'Update business category details' : 'Create a new business category'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-5">Basic Information</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Name (Arabic) *</label>
              <input
                value={form.nameAr}
                onChange={(e) => handleChange('nameAr', e.target.value)}
                className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
                placeholder="اسم التصنيف التجاري"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Name (English) *</label>
              <input
                value={form.nameEn}
                onChange={(e) => handleChange('nameEn', e.target.value)}
                className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
                placeholder="Business category name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Code</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-border-default rounded-lg text-sm text-text-secondary">
                <Hash size={14} className="text-text-tertiary flex-shrink-0" />
                <span className="font-mono">{form.code || 'Auto-generated from English name'}</span>
              </div>
              <p className="text-xs text-text-tertiary mt-1">Auto-generated from the English name</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Sort Order</label>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => handleChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">Active</label>
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
          <h3 className="text-sm font-bold text-text-primary font-display mb-5">Category Info</h3>
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <Info size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-text-primary font-body">Business Categories</p>
                <p className="text-xs text-text-secondary mt-1">
                  Business categories are used to classify suppliers and stores. Each supplier can be assigned to a business category.
                </p>
              </div>
            </div>
            {isEdit && (
              <div className="p-4 rounded-xl bg-gray-50 border border-border-default">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Suppliers</p>
                <p className="text-xl font-extrabold text-text-primary font-display mt-1">{suppliersCount}</p>
                <p className="text-xs text-text-secondary mt-0.5">{suppliersCount === 1 ? 'supplier is' : 'suppliers are'} assigned to this category</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSubmit} isLoading={saving}>
          {isEdit ? 'Save Changes' : 'Create Business Category'}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleBack}>Cancel</Button>
      </div>
    </div>
  );
}
