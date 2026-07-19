import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeliverySlotsPage, useCreateDeliverySlot, useUpdateDeliverySlot } from '../hooks/useDeliverySlots';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Clock, CalendarDays, Truck, Users, Plus, CheckCircle2, Calendar, Package, MapPin } from 'lucide-react';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { DeliverySlotForm } from '../components/DeliverySlotForm';
import type { DeliverySlot } from '../api/deliverySlotsApi';

export function DeliverySlotsPage() {
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();
  const { data, isLoading, isError, error, refetch } = useDeliverySlotsPage();
  const createSlot = useCreateDeliverySlot();
  const updateSlot = useUpdateDeliverySlot();

  const [createModal, setCreateModal] = useState(false);
  const [editSlot, setEditSlot] = useState<DeliverySlot | null>(null);

  const stats = data?.stats;
  const slots = data?.slots ?? [];

  if (isError) return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('deliverySlots.title')}</h1>
        <p className="text-sm text-text-secondary font-body mt-1">{t('deliverySlots.description')}</p>
      </div>
      <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-amber-500/10 via-amber-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Clock size={22} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('deliverySlots.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('deliverySlots.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-amber-500 via-brand-primary to-amber-500 rounded-full opacity-30" />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreateModal(true)}>
          {t('deliverySlots.addSlot')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
        {[
          { key: 'totalSlots', label: t('deliverySlots.stats.total'), icon: Clock, variant: 'teal' as const },
          { key: 'activeSlots', label: t('deliverySlots.stats.active'), icon: CheckCircle2, variant: 'success' as const },
          { key: 'todaySlots', label: t('deliverySlots.stats.today'), icon: Calendar, variant: 'purple' as const },
          { key: 'totalCapacity', label: t('deliverySlots.stats.capacity'), icon: Package, variant: 'coral' as const },
          { key: 'totalBooked', label: t('deliverySlots.stats.booked'), icon: Users, variant: 'warning' as const },
          { key: 'totalRemaining', label: t('deliverySlots.stats.remaining'), icon: Truck, variant: 'primary' as const },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : stats?.[s.key as keyof typeof stats]}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                  s.variant === 'success' ? 'bg-green-50 text-green-600' :
                  s.variant === 'purple' ? 'bg-purple-50 text-purple-600' :
                  s.variant === 'coral' ? 'bg-brand-accent-light text-brand-accent' :
                  s.variant === 'warning' ? 'bg-amber-50 text-amber-600' :
                  'bg-blue-50 text-blue-600'
                )}>
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Slots List */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('deliverySlots.list.title')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('deliverySlots.list.subtitle', { count: slots.length })}</p>
          </div>
        </CardHeader>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
        ) : slots.length === 0 ? (
          <EmptyState title={t('deliverySlots.list.empty')} description={t('deliverySlots.list.emptyDesc')} />
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`p-4 rounded-xl border transition-all ${
                  slot.is_available
                    ? 'border-border-default/60 bg-white'
                    : 'border-border-default/30 bg-gray-50 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarDays size={16} className="text-text-tertiary" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-text-primary font-body">
                          {new Date(slot.trip_date + 'T' + (slot.departure_time || '00:00')).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-text-primary font-body">
                          {slot.departure_time?.substring(0, 5)}–{slot.cutoff_time?.substring(0, 5)}
                        </span>
                        <Badge variant={slot.is_available ? 'green' : 'red'} size="sm">
                          {slot.is_available ? t('common.active') : t('common.inactive')}
                        </Badge>
                        {slot.warehouse && (
                          <Badge variant="teal" size="sm">
                            <Truck size={10} className="inline mr-1" />
                            {slot.warehouse.name}
                          </Badge>
                        )}
                        {slot.zone && (
                          <Badge variant="purple" size="sm">
                            <MapPin size={10} className="inline mr-1" />
                            {slot.zone.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-tertiary font-body mt-1.5">
                        <span className="flex items-center gap-1"><Package size={12} /> {t('deliverySlots.list.capacity', { count: slot.max_capacity })}</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {t('deliverySlots.list.booked', { count: slot.booked_count })}</span>
                        <span className="flex items-center gap-1"><Truck size={12} /> {t('deliverySlots.list.remaining', { count: slot.remaining_capacity })}</span>
                        <span className="font-semibold text-text-primary">{formatPrice(slot.delivery_fee)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditSlot(slot)}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant={slot.is_available ? 'secondary' : 'primary'}
                      size="sm"
                      isLoading={updateSlot.isPending}
                      onClick={() => updateSlot.mutate({ id: slot.id, data: { is_available: !slot.is_available } })}
                    >
                      {slot.is_available ? t('common.deactivate') : t('common.activate')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <DeliverySlotForm
        open={createModal}
        onClose={() => setCreateModal(false)}
        onSave={(formData) => createSlot.mutate(formData, { onSuccess: () => setCreateModal(false) })}
        isSaving={createSlot.isPending}
      />

      {/* Edit Modal */}
      <DeliverySlotForm
        open={!!editSlot}
        onClose={() => setEditSlot(null)}
        onSave={(formData) => {
          if (editSlot) {
            updateSlot.mutate(
              { id: editSlot.id, data: formData },
              { onSuccess: () => setEditSlot(null) }
            );
          }
        }}
        isSaving={updateSlot.isPending}
        editSlot={editSlot}
      />
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
