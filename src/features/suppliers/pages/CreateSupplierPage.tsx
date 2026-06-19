import { useState } from 'react';
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
      addToast('error', 'Business name and email are required');
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
        paymentTerms: form.paymentTerms as any,
        commissionRate: parseFloat(form.commissionRate) || 10,
        contactPerson: form.contactPerson,
        contactPhone: form.contactPhone,
      });
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      addToast('success', 'Supplier created successfully');
      navigate(ROUTES.SUPPLIERS);
    } catch {
      addToast('error', 'Failed to create supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button onClick={() => navigate(ROUTES.SUPPLIERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Suppliers
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Building2 size={22} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">Add Supplier</h1>
            <p className="text-sm text-text-secondary font-body">Register a new supplier</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Business Name (EN) *</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="Fresh Farm Co." />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Business Name (AR)</label>
              <input value={form.nameAr} onChange={(e) => handleChange('nameAr', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="المزرعة الطازجة" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="contact@supplier.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="+966501234001" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Contact Person</label>
              <input value={form.contactPerson} onChange={(e) => handleChange('contactPerson', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="Ahmed Al-Mutairi" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Contact Phone</label>
              <input value={form.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="+966501234111" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Address</label>
              <textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)} rows={2} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary resize-none" placeholder="Riyadh, Industrial Zone" />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">Business Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Commercial Register</label>
              <input value={form.commercialRegister} onChange={(e) => handleChange('commercialRegister', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="CR-2025-001" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Tax Number</label>
              <input value={form.taxNumber} onChange={(e) => handleChange('taxNumber', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="TX-3001" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Payment Terms</label>
              <select value={form.paymentTerms} onChange={(e) => handleChange('paymentTerms', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="net_15">Net 15</option>
                <option value="net_30">Net 30</option>
                <option value="net_45">Net 45</option>
                <option value="prepaid">Prepaid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Commission Rate (%)</label>
              <input type="number" min="0" max="100" value={form.commissionRate} onChange={(e) => handleChange('commissionRate', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="10" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSubmit} isLoading={saving}>Save Supplier</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.SUPPLIERS)}>Cancel</Button>
      </div>
    </div>
  );
}
