import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCountriesPage,
  useToggleCountryActive,
  useCreateCountry,
  useUpdateCountry,
  useDeleteCountry,
} from '../hooks/useCountries';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { Globe, CheckCircle2, MapPin, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { CountryForm } from '../components/CountryForm';

export function CountriesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useCountriesPage();
  const toggleActive = useToggleCountryActive();
  const createCountry = useCreateCountry();
  const updateCountry = useUpdateCountry();
  const deleteCountry = useDeleteCountry();

  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editCountry, setEditCountry] = useState<{
    id: number;
    name_ar: string;
    name_en: string | null;
    code: string;
    dial_code: string | null;
    is_active: boolean;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('locations.countries.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('locations.countries.description')}</p>
        </div>
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  const stats = data?.stats;
  const countries = data?.countries ?? [];
  const filtered = search
    ? countries.filter((c) =>
        c.name_ar.toLowerCase().includes(search.toLowerCase()) ||
        c.name_en?.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : countries;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-blue-500/10 via-blue-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Globe size={22} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('locations.countries.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('locations.countries.description')}</p>
            </div>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreateModal(true)}>
            {t('locations.countries.addCountry')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {[
          { key: 'totalCountries', label: t('locations.countries.stats.total'), icon: Globe, variant: 'teal' as const },
          { key: 'activeCountries', label: t('locations.countries.stats.active'), icon: CheckCircle2, variant: 'success' as const },
          { key: 'totalProvinces', label: t('locations.countries.stats.provinces'), icon: MapPin, variant: 'purple' as const },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : stats?.[s.key as keyof typeof stats] ?? '—'}
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

      {/* Countries List */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('locations.countries.list.title')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('locations.countries.list.count', { count: countries.length })}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('locations.countries.list.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-sm bg-bg-input border border-border-default rounded-lg outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState title={t('locations.countries.list.noCountries')} description={search ? t('locations.countries.list.tryDifferentSearch') : t('locations.countries.list.addFirstCountry')} />
        ) : (
          <div className="space-y-2">
            {filtered.map((country) => (
              <div
                key={country.id}
                onClick={() => navigate(ROUTES.COUNTRY_DETAIL(country.id))}
                className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary font-body truncate">{country.name_ar}</span>
                    {country.name_en && <span className="text-xs text-text-tertiary truncate">({country.name_en})</span>}
                    <span className="text-xs font-mono text-text-tertiary uppercase">{country.code}</span>
                    {country.dial_code && <span className="text-xs text-text-tertiary">+{country.dial_code}</span>}
                    {country.is_active ? (
                      <Badge variant="green" size="sm">{t('common.active')}</Badge>
                    ) : (
                      <Badge variant="red" size="sm">{t('common.inactive')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                    <span>{t('locations.countries.list.provincesCount', { count: country.provinces_count })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditCountry({
                        id: country.id,
                        name_ar: country.name_ar,
                        name_en: country.name_en,
                        code: country.code,
                        dial_code: country.dial_code,
                        is_active: country.is_active,
                      });
                    }}
                    className="p-1.5 rounded-md text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary transition-colors"
                    title={t('common.edit')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ id: country.id, name: country.name_ar });
                    }}
                    className="p-1.5 rounded-md text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                  <Button
                    variant={country.is_active ? 'secondary' : 'primary'}
                    size="sm"
                    isLoading={toggleActive.isPending}
                    onClick={(e) => { e.stopPropagation(); toggleActive.mutate(country.id); }}
                  >
                    {country.is_active ? t('common.deactivate') : t('common.activate')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Country Modal */}
      <CountryForm
        open={createModal}
        onClose={() => setCreateModal(false)}
        onSave={(data) => createCountry.mutate(data, { onSuccess: () => setCreateModal(false) })}
        isSaving={createCountry.isPending}
      />

      {/* Edit Country Modal */}
      <CountryForm
        open={!!editCountry}
        onClose={() => setEditCountry(null)}
        onSave={(data) => {
          if (editCountry) {
            updateCountry.mutate({ id: editCountry.id, data }, { onSuccess: () => setEditCountry(null) });
          }
        }}
        isSaving={updateCountry.isPending}
        editing={editCountry}
      />

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('locations.countries.deleteTitle', { name: deleteTarget?.name || '' })}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">
            {t('locations.countries.deleteConfirm', { name: deleteTarget?.name || '' })}
          </p>
          <p className="text-xs text-text-tertiary font-body">
            {t('locations.countries.deleteWarning')}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={deleteCountry.isPending} onClick={() => {
              if (deleteTarget) {
                deleteCountry.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
              }
            }}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
