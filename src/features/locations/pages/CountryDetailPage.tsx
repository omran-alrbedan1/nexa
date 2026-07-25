import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCountry, useToggleCountryActive, useUpdateCountry } from '../hooks/useCountries';
import { useCreateProvince, useUpdateProvince, useToggleProvinceActive, useDeleteProvince } from '../hooks/useProvinces';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { ArrowLeft, Globe, MapPin, CheckCircle2, Plus, Pencil, Trash2 } from 'lucide-react';
import { countryKeys } from '../hooks/useCountries';
import { CountryForm } from '../components/CountryForm';
import { ProvinceForm } from '../components/ProvinceForm';

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function CountryDetailPage() {
  const { countryId } = useParams<{ countryId: string }>();
  const navigate = useNavigate();
  const id = parseInt(countryId || '0', 10);
  const { t } = useTranslation();
  const toggleActive = useToggleCountryActive();
  const updateCountry = useUpdateCountry();
  const createProvince = useCreateProvince();
  const updateProvince = useUpdateProvince();
  const toggleProvince = useToggleProvinceActive();
  const deleteProvince = useDeleteProvince();

  const [editModal, setEditModal] = useState(false);
  const [provinceModal, setProvinceModal] = useState(false);
  const [editProvinceTarget, setEditProvinceTarget] = useState<{ id: number; data: { name_ar: string; name_en: string | null; is_active: boolean } } | null>(null);
  const [deleteProvinceTarget, setDeleteProvinceTarget] = useState<{ id: number; name: string } | null>(null);

  const { data: country, isLoading, isError, error, refetch } = useCountry(id);

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.COUNTRIES)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('locations.countries.detail.back')}
        </button>
        <ErrorState title={t('locations.countries.detail.errorTitle')} message={error instanceof Error ? error.message : 'An error occurred'} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !country) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <button onClick={() => navigate(ROUTES.COUNTRIES)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('locations.countries.detail.back')}
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-blue-500/10 via-blue-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Globe size={24} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display truncate">{country.name_ar}</h1>
                {country.name_en && <span className="text-sm text-text-tertiary truncate">({country.name_en})</span>}
                <span className="text-xs font-mono text-text-tertiary uppercase bg-white/60 px-2 py-0.5 rounded">{country.code}</span>
                {country.dial_code && <span className="text-xs text-text-tertiary">+{country.dial_code}</span>}
                {country.is_active ? (
                  <Badge variant="green" size="sm">{t('common.active')}</Badge>
                ) : (
                  <Badge variant="red" size="sm">{t('common.inactive')}</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" leftIcon={<Pencil size={14} />} onClick={() => setEditModal(true)}>
                {t('locations.countries.detail.edit')}
              </Button>
              <Button variant={country.is_active ? 'secondary' : 'primary'} size="sm" isLoading={toggleActive.isPending} onClick={() => toggleActive.mutate(country.id)}>
                {country.is_active ? t('common.deactivate') : t('common.activate')}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-blue-500 via-brand-primary to-blue-500 rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-primary-light text-brand-primary"><Globe size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('locations.countries.detail.code')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display uppercase">{country.code}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600"><MapPin size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('locations.countries.detail.provinces')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{country.provinces_count}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600"><CheckCircle2 size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('locations.countries.detail.dialCode')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">+{country.dial_code || '—'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Provinces Section */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('locations.countries.detail.provincesTitle')}</h3>
            <span className="text-xs text-text-tertiary">({country.provinces.length})</span>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setProvinceModal(true)}>
            {t('locations.countries.detail.addProvince')}
          </Button>
        </div>

        {country.provinces.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-8">{t('locations.countries.detail.noProvinces')}</p>
        ) : (
          <div className="space-y-2">
            {country.provinces.map((province) => (
              <div key={province.id} className="flex items-center justify-between p-3 rounded-xl border border-border-default/60 hover:border-blue-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-text-tertiary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary font-body">{province.name_ar}</span>
                      {province.name_en && <span className="text-xs text-text-tertiary">({province.name_en})</span>}
                      <Badge variant={province.is_active ? 'green' : 'red'} size="sm">
                        {province.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditProvinceTarget({
                      id: province.id,
                      data: {
                        name_ar: province.name_ar,
                        name_en: province.name_en,
                        is_active: province.is_active,
                      },
                    })}
                    className="p-1.5 rounded-md text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary transition-all"
                    title={t('common.edit')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteProvinceTarget({ id: province.id, name: province.name_ar })}
                    className="p-1.5 rounded-md text-text-secondary hover:bg-red-50 hover:text-red-500 transition-all"
                    title={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => toggleProvince.mutate(province.id)}
                    className="p-1.5 text-xs text-text-secondary hover:text-blue-600 rounded-lg hover:bg-bg-section-alt transition-all"
                  >
                    {province.is_active ? t('common.deactivate') : t('common.activate')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Country Modal */}
      <CountryForm
        open={editModal}
        onClose={() => setEditModal(false)}
        onSave={(data) => updateCountry.mutate({ id: country.id, data }, { onSuccess: () => setEditModal(false) })}
        isSaving={updateCountry.isPending}
        editing={country}
      />

      {/* Add Province Modal */}
      <ProvinceForm
        open={provinceModal}
        onClose={() => setProvinceModal(false)}
        onSave={(data) => createProvince.mutate({ ...data, country_id: country.id }, { onSuccess: () => setProvinceModal(false) })}
        isSaving={createProvince.isPending}
        countryCode={country.code}
      />

      {/* Edit Province Modal */}
      <ProvinceForm
        open={!!editProvinceTarget}
        onClose={() => setEditProvinceTarget(null)}
        onSave={(data) => {
          if (editProvinceTarget) {
            updateProvince.mutate({ id: editProvinceTarget.id, data }, { onSuccess: () => setEditProvinceTarget(null) });
          }
        }}
        isSaving={updateProvince.isPending}
        countryCode={country.code}
        editing={editProvinceTarget?.data ?? null}
      />

      {/* Delete Province Confirmation */}
      <Modal open={!!deleteProvinceTarget} onClose={() => setDeleteProvinceTarget(null)} title={t('locations.provinces.deleteTitle', { name: deleteProvinceTarget?.name || '' })}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">
            {t('locations.provinces.deleteConfirm', { name: deleteProvinceTarget?.name || '' })}
          </p>
          <p className="text-xs text-text-tertiary font-body">{t('locations.provinces.deleteWarning')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteProvinceTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={deleteProvince.isPending} onClick={() => {
              if (deleteProvinceTarget) {
                deleteProvince.mutate(deleteProvinceTarget.id, {
                  onSuccess: () => setDeleteProvinceTarget(null),
                });
              }
            }}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
