import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { campaignsApi, type Campaign } from '../api/campaignsApi';
import { ArrowLeft, Megaphone, Save, Image as ImageIcon } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiHelpers';

export function EditCampaignPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const id = parseInt(campaignId || '0', 10);

  const [form, setForm] = useState({
    name: '', nameAr: '', description: '', targetRegion: '1',
    startDate: '', endDate: '', status: 'draft',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id <= 0) return;
    setLoading(true);
    setError(null);
    campaignsApi.getCampaign(id)
      .then((c) => {
        setCampaign(c);
        setForm({
          name: c.name,
          nameAr: c.nameAr,
          description: c.description,
          targetRegion: '1',
          startDate: c.startDate.split('T')[0],
          endDate: c.endDate.split('T')[0],
          status: c.status,
        });
        setImagePreview(c.bannerUrl);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load campaign');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      addToast('error', 'Campaign name, start date, and end date are required');
      return;
    }
    setSaving(true);
    try {
      await campaignsApi.updateCampaign(id, {
        name: form.name,
        nameAr: form.nameAr || undefined,
        description: form.description || undefined,
        zoneId: parseInt(form.targetRegion, 10),
        startsAt: form.startDate,
        endsAt: form.endDate,
        status: form.status,
        image: imageFile || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      addToast('success', 'Campaign updated successfully');
      navigate(ROUTES.CAMPAIGN_DETAIL(id));
    } catch (err) {
      addToast('error', extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-up max-w-4xl">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="h-36 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-up max-w-4xl">
        <button onClick={() => navigate(ROUTES.CAMPAIGNS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> Back to Campaigns
        </button>
        <ErrorState
          title="Failed to load campaign"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button onClick={() => navigate(ROUTES.CAMPAIGN_DETAIL(id))} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Campaign
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Megaphone size={22} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">Edit Campaign</h1>
            <p className="text-sm text-text-secondary font-body">Update campaign details</p>
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
              <label className="block text-xs font-bold text-text-secondary mb-1">Status</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Image Upload */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={16} className="text-brand-accent" />
          <h3 className="text-sm font-bold text-text-primary font-display">Campaign Image</h3>
        </div>
        {imagePreview && (
          <div className="relative overflow-hidden rounded-xl mb-4">
            <img src={imagePreview} alt="Campaign preview" className="w-full h-48 md:h-64 object-cover" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-bg-input border border-border-default rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-brand-primary transition-colors">
            <ImageIcon size={16} />
            {imagePreview ? 'Change Image' : 'Upload Image'}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
          {imageFile && (
            <Button variant="secondary" size="sm" onClick={() => { setImageFile(null); setImagePreview(campaign?.bannerUrl || null); }}>
              Remove
            </Button>
          )}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} isLoading={saving} onClick={handleSubmit}>Save Changes</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.CAMPAIGN_DETAIL(id))}>Cancel</Button>
      </div>
    </div>
  );
}
