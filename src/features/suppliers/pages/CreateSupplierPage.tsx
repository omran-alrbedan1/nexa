import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { suppliersApi } from '../api/suppliersApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ArrowLeft, Building2, FileUp, Save, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { supplierKeys } from '../hooks/useSuppliers';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';

interface DocUpload {
  type: string;
  label: string;
  file: File | null;
  status: 'idle' | 'uploading' | 'done' | 'error';
  error?: string;
}

const FALLBACK_DOC_TYPES: Array<{ type: string; label: string }> = [
  { type: 'commercial_register', label: 'Commercial register' },
  { type: 'tax_card', label: 'Tax card' },
  { type: 'id_front', label: 'ID — front' },
  { type: 'id_back', label: 'ID — back' },
  { type: 'store_front', label: 'Store front photo' },
];

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
    const data = err.response.data as { message?: unknown; errors?: Record<string, unknown> };
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (data.errors) {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && typeof first[0] === 'string') {
        return first[0];
      }
    }
  }
  return fallback;
}

export function CreateSupplierPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);
  const [createdSupplierId, setCreatedSupplierId] = useState<number | null>(null);
  const [form, setForm] = useState<{
    names: Partial<Record<TranslatedLang, string>>;
    email: string; phone: string; address: string;
    commercialRegister: string; taxNumber: string;
    contactPerson: string; contactPhone: string;
  }>({
    names: {}, email: '', phone: '', address: '',
    commercialRegister: '', taxNumber: '',
    contactPerson: '', contactPhone: '',
  });
  const [docs, setDocs] = useState<DocUpload[]>([]);

  useEffect(() => {
    let cancelled = false;
    suppliersApi.getSupplierDocumentTypes()
      .then((types) => {
        if (cancelled) return;
        setDocs((types.length > 0 ? types : FALLBACK_DOC_TYPES).map((d) => ({ ...d, file: null, status: 'idle' })));
      })
      .catch(() => {
        if (!cancelled) setDocs(FALLBACK_DOC_TYPES.map((d) => ({ ...d, file: null, status: 'idle' })));
      });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (field: keyof typeof form, value: (typeof form)[typeof field]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFile = (index: number, file: File | null) => {
    setDocs((prev) => prev.map((d, i) => (i === index ? { ...d, file, status: 'idle', error: undefined } : d)));
  };

  const uploadDoc = async (index: number, supplierId: number) => {
    const doc = docs[index];
    if (!doc.file) return;
    setDocs((prev) => prev.map((d, i) => (i === index ? { ...d, status: 'uploading', error: undefined } : d)));
    try {
      await suppliersApi.uploadSupplierDocument(supplierId, doc.type, doc.file);
      setDocs((prev) => prev.map((d, i) => (i === index ? { ...d, status: 'done' } : d)));
    } catch (err) {
      const message = extractErrorMessage(err, t('suppliers.create.documents.uploadFailed'));
      setDocs((prev) => prev.map((d, i) => (i === index ? { ...d, status: 'error', error: message } : d)));
    }
  };

  const uploadSelected = async (supplierId: number) => {
    await Promise.all(
      docs.map((doc, index) => (doc.file ? uploadDoc(index, supplierId) : Promise.resolve()))
    );
  };

  const handleSubmit = async () => {
    if (!form.names.en?.trim() && !form.names.ar?.trim()) {
      addToast('error', t('suppliers.create.required'));
      return;
    }
    if (!form.email) {
      addToast('error', t('suppliers.create.required'));
      return;
    }
    setSaving(true);
    try {
      const supplier = await suppliersApi.createSupplier({
        name: form.names.en?.trim() || form.names.ar?.trim() || '',
        nameAr: form.names.ar,
        nameHe: form.names.he,
        nameRu: form.names.ru,
        email: form.email,
        phone: form.phone,
        address: form.address,
        commercialRegister: form.commercialRegister,
        taxNumber: form.taxNumber,
        contactPerson: form.contactPerson,
        contactPhone: form.contactPhone,
      });

      setCreatedSupplierId(supplier.id);

      if (docs.some((d) => d.file)) {
        await uploadSelected(supplier.id);
      }

      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      addToast('success', t('suppliers.create.success'));
      navigate(ROUTES.SUPPLIER_DETAIL(supplier.id));
    } catch (err) {
      const message = extractErrorMessage(err, t('suppliers.create.failed'));
      addToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  const statusIcon = (doc: DocUpload) => {
    if (doc.status === 'uploading') return <Loader2 size={14} className="text-brand-primary animate-spin" />;
    if (doc.status === 'done') return <CheckCircle2 size={14} className="text-green-600" />;
    if (doc.status === 'error') return <XCircle size={14} className="text-red-600" />;
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl mx-auto w-full">
      <button onClick={() => navigate(ROUTES.SUPPLIERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('suppliers.create.back')}
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Building2 size={22} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('suppliers.create.title')}</h1>
            <p className="text-sm text-text-secondary font-body">{t('suppliers.create.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">{t('suppliers.create.contactInfo')}</h3>
          <div className="space-y-4">
            <TranslatedField
              label={t('suppliers.create.businessName')}
              placeholder={t('suppliers.create.businessNamePlaceholder')}
              values={form.names}
              onChange={(lang, value) =>
                setForm((prev) => ({ ...prev, names: { ...prev.names, [lang]: value } }))
              }
              required
            />
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.create.email')}</label>
              <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('suppliers.create.emailPlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.create.phone')}</label>
              <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('suppliers.create.phonePlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.create.contactPerson')}</label>
              <input value={form.contactPerson} onChange={(e) => handleChange('contactPerson', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('suppliers.create.contactPersonPlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.create.contactPhone')}</label>
              <input value={form.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('suppliers.create.contactPhonePlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.create.address')}</label>
              <textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)} rows={2} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary resize-none" placeholder={t('suppliers.create.addressPlaceholder')} />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">{t('suppliers.create.businessDetails')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.create.commercialRegister')}</label>
              <input value={form.commercialRegister} onChange={(e) => handleChange('commercialRegister', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('suppliers.create.commercialRegisterPlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.create.taxNumber')}</label>
              <input value={form.taxNumber} onChange={(e) => handleChange('taxNumber', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('suppliers.create.taxNumberPlaceholder')} />
            </div>
          </div>

          <h3 className="text-sm font-bold text-text-primary font-display mt-6 mb-1 flex items-center gap-2">
            <FileUp size={14} className="text-brand-primary" />
            {t('suppliers.create.documents.title')}
          </h3>
          <p className="text-xs text-text-secondary font-body mb-3">{t('suppliers.create.documents.subtitle')}</p>
          <div className="space-y-2">
            {docs.map((doc, index) => (
              <div key={doc.type} className="flex items-center gap-2 p-2.5 border border-border-default rounded-lg bg-bg-card">
                <label className="flex-1 min-w-0 cursor-pointer">
                  <span className="block text-xs font-bold text-text-primary font-body truncate">{t(`suppliers.create.documents.types.${doc.type}`, doc.label)}</span>
                  {doc.file && (
                    <span className="block text-[11px] text-text-tertiary font-body truncate">
                      {doc.status === 'done'
                        ? t('suppliers.create.documents.uploaded')
                        : doc.status === 'error'
                          ? doc.error
                          : doc.file.name}
                    </span>
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFile(index, e.target.files?.[0] ?? null)}
                  />
                </label>
                <div className="flex items-center gap-1.5 shrink-0">
                  {doc.status === 'error' && createdSupplierId !== null && (
                    <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={12} />} onClick={() => uploadDoc(index, createdSupplierId)}>
                      {t('common.retry')}
                    </Button>
                  )}
                  {statusIcon(doc)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSubmit} isLoading={saving}>{t('suppliers.create.save')}</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.SUPPLIERS)}>{t('suppliers.create.cancel')}</Button>
      </div>
    </div>
  );
}
