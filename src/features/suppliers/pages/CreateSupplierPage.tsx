import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../api/suppliersApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import { supplierKeys } from '../hooks/useSuppliers';

export function CreateSupplierPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', nameAr: '', email: '', phone: '', address: '',
    commercialRegister: '', taxNumber: '', paymentTerms: 'net_30',
    commissionRate: '10', contactPerson: '', contactPhone: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      addToast('error', t('suppliers.create.required'));
      return;
    }
    setSaving(true);
    try {
      await suppliersApi.createSupplier({
        name: form.name,
        nameAr: form.nameAr,
        email: form.email,
        phone: form.phone,
        address: form.address,
        commercialRegister: form.commercialRegister,
        taxNumber: form.taxNumber,
        paymentTerms: form.paymentTerms as 'net_15' | 'net_30' | 'net_45' | 'prepaid',
        commissionRate: parseFloat(form.commissionRate) || 10,
        contactPerson: form.contactPerson,
        contactPhone: form.contactPhone,
      });
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      addToast('success', t('suppliers.create.success'));
      navigate(ROUTES.SUPPLIERS);
    } catch {
      addToast('error', t('suppliers.create.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
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
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.create.businessNameEn')}</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('suppliers.create.businessNameEnPlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.create.businessNameAr')}</label>
              <input value={form.nameAr} onChange={(e) => handleChange('nameAr', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('suppliers.create.businessNameArPlaceholder')} dir="rtl" />
            </div>
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
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.create.paymentTerms')}</label>
              <select value={form.paymentTerms} onChange={(e) => handleChange('paymentTerms', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="net_15">{t('suppliers.create.paymentTermNet15')}</option>
                <option value="net_30">{t('suppliers.create.paymentTermNet30')}</option>
                <option value="net_45">{t('suppliers.create.paymentTermNet45')}</option>
                <option value="prepaid">{t('suppliers.create.paymentTermPrepaid')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('suppliers.create.commissionRate')}</label>
              <input type="number" min="0" max="100" value={form.commissionRate} onChange={(e) => handleChange('commissionRate', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('suppliers.create.commissionRatePlaceholder')} />
            </div>
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
