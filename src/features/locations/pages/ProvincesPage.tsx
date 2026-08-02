import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useProvincesList,
  useCreateProvince,
  useUpdateProvince,
  useToggleProvinceActive,
  useDeleteProvince,
} from '../hooks/useProvinces';
import { useCountriesPage } from '../hooks/useCountries';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { MapPin, Plus, Search, Globe, Pencil, Trash2, CheckCircle2, Layers } from 'lucide-react';
import { ProvinceForm } from '../components/ProvinceForm';

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function ProvincesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: number; data: { name_ar: string; name_en: string | null; name_he: string | null; name_ru: string | null; is_active: boolean } } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const { data: countriesData } = useCountriesPage();
  const countries = countriesData?.countries ?? [];

  const { data, isLoading, isError, error, refetch } = useProvincesList({
    country_id: countryFilter || undefined,
    search: search || undefined,
    page,
  });

  const createProvince = useCreateProvince();
  const updateProvince = useUpdateProvince();
  const toggleProvince = useToggleProvinceActive();
  const deleteProvince = useDeleteProvince();

  const provinces = data?.data ?? [];
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };
  const total = meta.total;

  const activeProvinces = provinces.filter((p) => p.is_active).length;
  const totalZones = provinces.reduce((sum, p) => sum + p.zones_count, 0);

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('locations.provinces.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('locations.provinces.description')}</p>
        </div>
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-teal-500/10 via-teal-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <MapPin size={22} className="text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('locations.provinces.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('locations.provinces.description')}</p>
            </div>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreateModal(true)}>
            {t('locations.provinces.addProvince')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {[
          { key: 'total', label: t('locations.provinces.stats.total'), icon: MapPin, variant: 'teal' as const },
          { key: 'active', label: t('locations.provinces.stats.active'), icon: CheckCircle2, variant: 'success' as const },
          { key: 'zones', label: t('locations.provinces.stats.zones'), icon: Layers, variant: 'purple' as const },
        ].map((s) => {
          const Icon = s.icon;
          const val = s.key === 'total' ? total : s.key === 'active' ? activeProvinces : totalZones;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : val ?? '—'}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                  s.variant === 'success' ? 'bg-green-50 text-green-600' :
                  'bg-purple-50 text-purple-600'
                )}>
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* List */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('locations.provinces.list.title')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('locations.provinces.list.count', { count: total })}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('locations.provinces.list.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-sm bg-bg-input border border-border-default rounded-lg outline-none focus:border-brand-primary"
            />
          </div>
          <select
            value={countryFilter}
            onChange={(e) => { setCountryFilter(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
            className="px-3 py-2 text-sm border border-border-default rounded-lg outline-none focus:ring-2 focus:ring-brand-primary bg-bg-input"
          >
            <option value="">{t('locations.provinces.list.allCountries')}</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name_ar} ({c.code})</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
        ) : provinces.length === 0 ? (
          <EmptyState title={t('locations.provinces.list.noProvinces')} description={search || countryFilter ? t('locations.provinces.list.tryDifferentSearch') : t('locations.provinces.list.addFirstProvince')} />
        ) : (
          <div className="space-y-2">
            {provinces.map((province) => (
              <div key={province.id} className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary font-body">{province.name_ar}</span>
                    {province.name_en && <span className="text-xs text-text-tertiary">({province.name_en})</span>}
                    {province.is_active ? (
                      <Badge variant="green" size="sm">{t('common.active')}</Badge>
                    ) : (
                      <Badge variant="red" size="sm">{t('common.inactive')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                    {province.country && (
                      <span className="flex items-center gap-1"><Globe size={12} /> {province.country.name_ar} ({province.country.code})</span>
                    )}
                    <span>·</span>
                    <span>{t('locations.provinces.list.zonesCount', { count: province.zones_count })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => setEditTarget({
                      id: province.id,
                      data: {
                        name_ar: province.name_ar,
                        name_en: province.name_en,
                        name_he: province.name_he,
                        name_ru: province.name_ru,
                        is_active: province.is_active,
                      },
                    })}
                    className="p-1.5 rounded-md text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary transition-colors"
                    title={t('common.edit')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: province.id, name: province.name_ar })}
                    className="p-1.5 rounded-md text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                  <Button
                    variant={province.is_active ? 'secondary' : 'primary'}
                    size="sm"
                    isLoading={toggleProvince.isPending}
                    onClick={() => toggleProvince.mutate(province.id)}
                  >
                    {province.is_active ? t('common.deactivate') : t('common.activate')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={meta.currentPage}
          lastPage={meta.lastPage}
          total={meta.total}
          perPage={15}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </Card>

      {/* Create Province Modal */}
      <ProvinceForm
        open={createModal}
        onClose={() => setCreateModal(false)}
        onSave={(data) => createProvince.mutate(
          { country_id: Number(countryFilter) || (countries[0]?.id || 0), ...data },
          { onSuccess: () => setCreateModal(false) }
        )}
        isSaving={createProvince.isPending}
      />

      {/* Edit Province Modal */}
      <ProvinceForm
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={(data) => {
          if (editTarget) {
            updateProvince.mutate({ id: editTarget.id, data }, { onSuccess: () => setEditTarget(null) });
          }
        }}
        isSaving={updateProvince.isPending}
        editing={editTarget?.data ?? null}
      />

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('locations.provinces.deleteTitle', { name: deleteTarget?.name || '' })}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">
            {t('locations.provinces.deleteConfirm', { name: deleteTarget?.name || '' })}
          </p>
          <p className="text-xs text-text-tertiary font-body">
            {t('locations.provinces.deleteWarning')}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={deleteProvince.isPending} onClick={() => {
              if (deleteTarget) {
                deleteProvince.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
              }
            }}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
