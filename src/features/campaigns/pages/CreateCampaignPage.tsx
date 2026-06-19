import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { ArrowLeft, Megaphone, Save, Plus, X } from 'lucide-react';

interface CampaignFormProduct {
  id: number;
  productName: string;
  regularPrice: number;
  campaignPrice: string;
  quantity: string;
}

export function CreateCampaignPage() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState({
    name: '', nameAr: '', description: '', targetRegion: '1',
    startDate: '', endDate: '', status: 'draft',
  });
  const [products, setProducts] = useState<CampaignFormProduct[]>([]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addProduct = () => {
    const newId = products.length + 1;
    setProducts((prev) => [...prev, {
      id: newId, productName: `Product ${newId}`, regularPrice: 0,
      campaignPrice: '', quantity: '',
    }]);
  };

  const removeProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateProduct = (id: number, field: string, value: string) => {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = () => {
    if (!form.name || !form.startDate || !form.endDate) {
      addToast('error', 'Campaign name, start date, and end date are required');
      return;
    }
    addToast('success', 'Campaign created (dummy — no backend)');
    navigate(ROUTES.CAMPAIGNS);
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button onClick={() => navigate(ROUTES.CAMPAIGNS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Campaigns
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Megaphone size={22} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">Create Campaign</h1>
            <p className="text-sm text-text-secondary font-body">Set up a new seasonal campaign</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">Campaign Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Campaign Name (EN) *</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="Summer Fruits Festival" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Campaign Name (AR)</label>
              <input value={form.nameAr} onChange={(e) => handleChange('nameAr', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder="مهرجان الفواكه الصيفية" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary resize-none" placeholder="Campaign description..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Target Region</label>
              <select value={form.targetRegion} onChange={(e) => handleChange('targetRegion', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="1">Riyadh North</option>
                <option value="2">Riyadh South</option>
                <option value="3">Jeddah Central</option>
                <option value="4">Dammam East</option>
                <option value="5">Mecca North</option>
              </select>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-bold text-text-primary font-display mb-4">Schedule</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">End Date *</label>
              <input type="date" value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Initial Status</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Products */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-text-primary font-display">Campaign Products</h3>
          <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={addProduct}>Add Product</Button>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-text-tertiary font-body">No products added yet. Click "Add Product" to include items with campaign pricing.</p>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border-default/60">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-secondary mb-1">Product Name</p>
                  <input value={p.productName} onChange={(e) => updateProduct(p.id, 'productName', e.target.value)} className="w-full px-2 py-1.5 bg-bg-input border border-border-default rounded text-xs outline-none focus:border-brand-primary" />
                </div>
                <div className="w-20">
                  <p className="text-xs font-bold text-text-secondary mb-1">Regular</p>
                  <p className="text-xs text-text-secondary py-1.5">{p.regularPrice > 0 ? `${p.regularPrice} SAR` : '—'}</p>
                </div>
                <div className="w-24">
                  <p className="text-xs font-bold text-text-secondary mb-1">Campaign Price</p>
                  <input type="number" step="0.5" min="0" value={p.campaignPrice} onChange={(e) => updateProduct(p.id, 'campaignPrice', e.target.value)} className="w-full px-2 py-1.5 bg-bg-input border border-border-default rounded text-xs outline-none focus:border-brand-primary" placeholder="0.00" />
                </div>
                <div className="w-20">
                  <p className="text-xs font-bold text-text-secondary mb-1">Qty</p>
                  <input type="number" min="0" value={p.quantity} onChange={(e) => updateProduct(p.id, 'quantity', e.target.value)} className="w-full px-2 py-1.5 bg-bg-input border border-border-default rounded text-xs outline-none focus:border-brand-primary" placeholder="0" />
                </div>
                <button onClick={() => removeProduct(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-tertiary hover:text-red-500 transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSubmit}>Save Campaign</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.CAMPAIGNS)}>Cancel</Button>
      </div>
    </div>
  );
}
