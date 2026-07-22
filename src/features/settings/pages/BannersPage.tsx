import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '../hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListItem } from '@/components/ui/ListItem';
import { Image, Plus, Pencil, Trash2, Calendar, ToggleLeft, ToggleRight, Upload } from 'lucide-react';
import type { Banner } from '../api/settingsApi';

export function BannersPage() {
  const { t } = useTranslation();
  const { data: banners, isLoading, isError, error, refetch } = useBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modal, setModal] = useState<{ open: boolean; editing: Banner | null }>({ open: false, editing: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; banner: Banner | null }>({ open: false, banner: null });
  const [form, setForm] = useState<{ title: string; image: string | File; linkType: string; sortOrder: number; isActive: boolean }>({ title: '', image: '', linkType: '', sortOrder: 1, isActive: true });

  const openCreate = () => {
    setForm({ title: '', image: '', linkType: '', sortOrder: 1, isActive: true });
    setModal({ open: true, editing: null });
  };

  const openEdit = (banner: Banner) => {
    setForm({ title: banner.title, image: banner.image, linkType: banner.linkType, sortOrder: banner.sortOrder, isActive: banner.isActive });
    setModal({ open: true, editing: banner });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, image: file });
    }
  };

  const handleSave = () => {
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('link_type', form.linkType);
    fd.append('sort_order', String(form.sortOrder));
    fd.append('is_active', form.isActive ? '1' : '0');
    if (form.image instanceof File) {
      fd.append('image', form.image);
    }
    if (modal.editing) {
      fd.append('_method', 'PUT');
      updateBanner.mutate({ id: modal.editing.id, data: fd });
    } else {
      createBanner.mutate(fd);
    }
    setModal({ open: false, editing: null });
  };

  const handleDelete = () => {
    if (deleteModal.banner) {
      deleteBanner.mutate(deleteModal.banner.id);
      setDeleteModal({ open: false, banner: null });
    }
  };

  const toggleActive = (banner: Banner) => {
    updateBanner.mutate({ id: banner.id, data: { isActive: !banner.isActive } });
  };

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.banners.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('settings.banners.description')}</p>
        </div>
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <Image size={22} className="text-brand-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('settings.banners.title')}</h1>
                <p className="text-sm text-text-secondary font-body">{t('settings.banners.description')}</p>
              </div>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
              {t('settings.banners.addBanner')}
            </Button>
          </div>
        </div>
      </div>

      <Card padding="lg">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
          </div>
        ) : !banners || banners.length === 0 ? (
          <EmptyState title={t('settings.banners.noBanners')} description={t('settings.banners.addFirst')} />
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => (
              <ListItem
                key={banner.id}
                icon={<Image size={16} className="text-brand-primary" />}
                title={<span className="text-sm font-bold text-text-primary font-body truncate">{banner.title}</span>}
                badges={<Badge variant={banner.isActive ? 'green' : 'red'} size="sm">{banner.isActive ? t('common.active') : t('common.inactive')}</Badge>}
                actions={<>
                  <button onClick={() => toggleActive(banner)} className="p-1.5 text-text-secondary hover:text-brand-primary rounded-lg hover:bg-bg-section-alt transition-all" title={banner.isActive ? t('common.deactivate') : t('common.activate')}>
                    {banner.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => openEdit(banner)} className="p-1.5 text-text-secondary hover:text-brand-primary rounded-lg hover:bg-bg-section-alt transition-all">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setDeleteModal({ open: true, banner })} className="p-1.5 text-text-secondary hover:text-status-error rounded-lg hover:bg-brand-accent-light transition-all">
                    <Trash2 size={16} />
                  </button>
                </>}
              >
                <div className="flex items-center gap-3 text-xs text-text-tertiary font-body flex-wrap">
                  <span>{t('settings.banners.order')}: {banner.sortOrder}</span>
                  {banner.zone && <span>{banner.zone.nameAr}</span>}
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(banner.startsAt).toLocaleDateString()} - {new Date(banner.endsAt).toLocaleDateString()}</span>
                </div>
              </ListItem>
            ))}
          </div>
        )}
      </Card>

      {/* Create/Edit Banner Modal */}
      <Modal open={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.editing ? t('settings.banners.editBanner') : t('settings.banners.createBanner')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.banners.titleField')}</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.banners.imageUrl')}</label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer"
              />
              {form.image && typeof form.image === 'string' && (
                <img src={form.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
              {form.image instanceof File && (
                <img src={URL.createObjectURL(form.image)} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.banners.linkType')}</label>
              <input value={form.linkType} onChange={(e) => setForm({ ...form, linkType: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" placeholder="category/product" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('settings.banners.sortOrder')}</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-border-default" />
            <span className="text-sm text-text-primary font-body">{t('common.active')}</span>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModal({ ...modal, open: false })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={createBanner.isPending || updateBanner.isPending} onClick={handleSave}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, banner: null })} title={t('settings.banners.deleteTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">{t('settings.banners.deleteDescription', { title: deleteModal.banner?.title })}</p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteModal({ open: false, banner: null })}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={deleteBanner.isPending} onClick={handleDelete}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
