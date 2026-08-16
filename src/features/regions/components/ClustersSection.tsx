import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClusters, useCreateCluster, useUpdateCluster, useDeleteCluster } from '../hooks/useRegions';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Layers, MapPin, Plus, Pencil, Trash2 } from 'lucide-react';

interface ClustersSectionProps {
  zoneId: number;
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function ClustersSection({ zoneId }: ClustersSectionProps) {
  const { t } = useTranslation();
  const { data: clusters, isLoading } = useClusters();
  const createCluster = useCreateCluster();
  const updateCluster = useUpdateCluster();
  const deleteCluster = useDeleteCluster();

  const zoneClusters = (clusters || []).filter((c: any) => c.zone?.id === zoneId || c.zone_id === zoneId);

  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; cluster: any | null }>({ open: false, cluster: null });
  const [form, setForm] = useState({ name_ar: '', name_en: '', code: '' });

  const openCreate = () => {
    setForm({ name_ar: '', name_en: '', code: '' });
    setCreateModal(true);
  };

  const openEdit = (cluster: any) => {
    setForm({ name_ar: cluster.name_ar, name_en: cluster.name_en || '', code: cluster.code || '' });
    setEditModal({ open: true, cluster });
  };

  const handleCreate = () => {
    createCluster.mutate({ zone_id: zoneId, ...form }, { onSuccess: () => setCreateModal(false) });
  };

  const handleUpdate = () => {
    if (editModal.cluster) {
      updateCluster.mutate({ id: editModal.cluster.id, data: form }, { onSuccess: () => setEditModal({ open: false, cluster: null }) });
    }
  };

  const handleToggleActive = (cluster: any) => {
    updateCluster.mutate({ id: cluster.id, data: { is_active: !cluster.is_active } });
  };

  const handleDelete = (id: number) => {
    if (confirm(t('regions.clusters.confirmDelete'))) {
      deleteCluster.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('regions.clusters.title')}</h3>
          <span className="text-xs text-text-tertiary">({zoneClusters.length})</span>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          {t('regions.clusters.addCluster')}
        </Button>
      </div>

      {zoneClusters.length === 0 ? (
        <EmptyState title={t('regions.clusters.noClusters')} description={t('regions.clusters.addFirst')} />
      ) : (
        <div className="space-y-2">
          {zoneClusters.map((cluster: any) => (
            <div key={cluster.id} className="flex items-center justify-between p-3 rounded-xl border border-border-default/60 hover:border-brand-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-text-tertiary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary font-body">{cluster.name_ar}</span>
                    {cluster.name_en && <span className="text-xs text-text-tertiary">({cluster.name_en})</span>}
                    <Badge variant={cluster.is_active ? 'green' : 'red'} size="sm">
                      {cluster.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </div>
                  {cluster.code && <p className="text-xs text-text-tertiary font-body mt-0.5">{cluster.code}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => handleToggleActive(cluster)} className="p-1.5 text-xs text-text-secondary hover:text-brand-primary rounded-lg hover:bg-bg-section-alt transition-all">
                  {cluster.is_active ? t('common.deactivate') : t('common.activate')}
                </button>
                <button onClick={() => openEdit(cluster)} className="p-1.5 text-text-secondary hover:text-brand-primary rounded-lg hover:bg-bg-section-alt transition-all">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(cluster.id)} className="p-1.5 text-text-secondary hover:text-status-error rounded-lg hover:bg-brand-accent-light transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title={t('regions.clusters.createTitle')}>
        <div className="space-y-4">
          <ClusterForm form={form} onChange={setForm} />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setCreateModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={createCluster.isPending} onClick={handleCreate}>{t('regions.clusters.create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, cluster: null })} title={t('regions.clusters.editTitle')}>
        <div className="space-y-4">
          <ClusterForm form={form} onChange={setForm} />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setEditModal({ open: false, cluster: null })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={updateCluster.isPending} onClick={handleUpdate}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ClusterForm({ form, onChange }: { form: { name_ar: string; name_en: string; code: string }; onChange: (f: typeof form) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.clusters.nameAr')}</label>
        <input value={form.name_ar} onChange={(e) => onChange({ ...form, name_ar: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" dir="rtl" />
      </div>
      <div>
        <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.clusters.nameEn')}</label>
        <input value={form.name_en} onChange={(e) => onChange({ ...form, name_en: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
      </div>
      <div>
        <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.clusters.code')}</label>
        <input value={form.code} onChange={(e) => onChange({ ...form, code: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
      </div>
    </div>
  );
}
