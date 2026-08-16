import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useAggregationPage } from '../hooks/useAggregation';
import { useWarehousesList } from '@/features/warehouses/hooks/useWarehouses';
import { SupplyReceivingSection } from '../components/SupplyReceivingSection';
import { AggregationQueueSection } from '../components/AggregationQueueSection';
import { ReadyToShipSection } from '../components/ReadyToShipSection';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card } from '@/components/ui/Card';
import { Package, Boxes, Ship, Users, Warehouse, Receipt, ListOrdered, Truck, Building2 } from 'lucide-react';

const TABS = [
  { key: 'supply', labelKey: 'warehouse.supplyReceiving.title', icon: Receipt },
  { key: 'queue', labelKey: 'warehouse.aggregationQueue.title', icon: ListOrdered },
  { key: 'ship', labelKey: 'warehouse.readyToShip.title', icon: Truck },
];

const DEFAULT_META = { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };

export function AggregationPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined);
  const [supplyPage, setSupplyPage] = useState(1);
  const [queuePage, setQueuePage] = useState(1);
  const [shipPage, setShipPage] = useState(1);
  const { data, isLoading, error, refetch } = useAggregationPage({ warehouseId, supplyPage, queuePage, shipPage });
  const { data: warehousesData } = useWarehousesList(undefined, 1);
  const [activeTab, setActiveTab] = useState('supply');

  if (error) {
    return (
      <ErrorState
        title={t('common.error')}
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Warehouse size={28} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('warehouse.title')}</h1>
            <p className="text-sm text-text-secondary font-body mt-1">{t('warehouse.description')}</p>
          </div>
          {isAdmin && (
            <div className="ml-auto flex items-center gap-2">
              <Building2 size={16} className="text-text-tertiary" />
              <select
                value={warehouseId ?? ''}
                onChange={(e) => {
                  setWarehouseId(e.target.value ? Number(e.target.value) : undefined);
                  setSupplyPage(1);
                  setQueuePage(1);
                  setShipPage(1);
                }}
                className="px-3 py-1.5 text-sm bg-white border border-border-default rounded-lg outline-none focus:border-brand-primary font-body"
              >
                <option value="">{t('warehouse.allWarehouses')}</option>
                {(warehousesData?.data || []).map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-purple-500 via-brand-primary to-purple-500 rounded-full opacity-30" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {[
          { label: t('warehouse.stats.itemsReceived'), value: data?.throughput.itemsReceived ?? 0, icon: Package, color: 'teal' },
          { label: t('warehouse.stats.itemsProcessed'), value: data?.throughput.itemsProcessed ?? 0, icon: Boxes, color: 'teal' },
          { label: t('warehouse.stats.itemsShipped'), value: data?.throughput.itemsShipped ?? 0, icon: Ship, color: 'teal' },
          { label: t('warehouse.stats.activeWorkers'), value: data?.throughput.activeWorkers ?? 0, icon: Users, color: 'warning' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? (
                      <span className="inline-block h-7 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : stat.value}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  stat.color === 'teal' ? 'bg-brand-primary-light text-brand-primary' : 'bg-amber-50 text-amber-600'
                )}>
                  <Icon size={20} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-bg-section-alt rounded-xl overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-white text-brand-primary shadow-sm font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon size={16} />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'supply' && (
        <SupplyReceivingSection
          items={data?.supplyReceiving ?? []}
          isLoading={isLoading}
          meta={data?.supplyMeta ?? DEFAULT_META}
          onPageChange={(p) => {
            setSupplyPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
      {activeTab === 'queue' && (
        <AggregationQueueSection
          items={data?.aggregationQueue ?? []}
          isLoading={isLoading}
          meta={data?.queueMeta ?? DEFAULT_META}
          onPageChange={(p) => {
            setQueuePage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
      {activeTab === 'ship' && (
        <ReadyToShipSection
          items={data?.readyToShip ?? []}
          isLoading={isLoading}
          meta={data?.shipMeta ?? DEFAULT_META}
          onPageChange={(p) => {
            setShipPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
