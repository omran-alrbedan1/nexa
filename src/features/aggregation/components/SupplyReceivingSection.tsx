import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useConfirmReceipt } from '../hooks/useAggregation';
import type { WarehouseSupplyItem, SupplyStatus } from '../api/aggregationApi';

const STATUS_COLORS: Record<SupplyStatus, 'green' | 'yellow' | 'blue' | 'orange' | 'red'> = {
  pending: 'yellow',
  awaiting_supplier: 'orange',
  in_transit: 'blue',
  confirmed: 'green',
  partial: 'orange',
  cancelled: 'red',
};

interface SupplyReceivingSectionProps {
  items: WarehouseSupplyItem[];
  isLoading: boolean;
}

export function SupplyReceivingSection({ items, isLoading }: SupplyReceivingSectionProps) {
  const { t } = useTranslation();
  const STATUS_LABELS: Record<SupplyStatus, string> = {
    pending: t('warehouse.supplyReceiving.pending'),
    awaiting_supplier: t('warehouse.supplyReceiving.awaitingSupplier'),
    in_transit: t('warehouse.supplyReceiving.inTransit'),
    confirmed: t('warehouse.supplyReceiving.confirmed'),
    partial: t('warehouse.supplyReceiving.partial'),
    cancelled: t('warehouse.supplyReceiving.cancelled'),
  };
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplyStatus | ''>('');
  const confirmReceipt = useConfirmReceipt();

  const filtered = items.filter((item) => {
    const matchesSearch = !search || 
      item.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      item.purchaseOrderNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = items.filter((i) => i.status === 'pending' || i.status === 'awaiting_supplier' || i.status === 'in_transit').length;

  return (
    <Card padding="md">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('warehouse.supplyReceiving.title')}</h3>
            <p className="text-xs text-gray-500">
              {t('warehouse.supplyReceiving.pendingDelivery', { count: pendingCount })} · {t('warehouse.supplyReceiving.total', { count: items.length })}
            </p>
          </div>
        </div>
      </CardHeader>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('warehouse.supplyReceiving.searchPlaceholder')}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SupplyStatus | '')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('warehouse.supplyReceiving.allStatuses')}</option>
          <option value="pending">{t('warehouse.supplyReceiving.pending')}</option>
          <option value="awaiting_supplier">{t('warehouse.supplyReceiving.awaitingSupplier')}</option>
          <option value="in_transit">{t('warehouse.supplyReceiving.inTransit')}</option>
          <option value="confirmed">{t('warehouse.supplyReceiving.confirmed')}</option>
          <option value="partial">{t('warehouse.supplyReceiving.partial')}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t('warehouse.supplyReceiving.noItems')}
          description={search ? t('warehouse.supplyReceiving.tryDifferentSearch') : t('warehouse.supplyReceiving.noDeliveries')}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{item.supplier.name}</span>
                  <span className="text-xs text-gray-400">{item.purchaseOrderNumber}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{item.items}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{t('warehouse.supplyReceiving.itemsCount', { count: item.itemCount })}</span>
                  {item.eta && (
                    <>
                      <span>·</span>
                      <span>{t('warehouse.supplyReceiving.eta', { time: new Date(item.eta).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) })}</span>
                    </>
                  )}
                  {item.notes && (
                    <>
                      <span>·</span>
                      <span className="text-amber-500 truncate max-w-[200px]" title={item.notes}>{item.notes}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                <StatusBadge
                  status={STATUS_LABELS[item.status]}
                  color={STATUS_COLORS[item.status]}
                />
                {(item.status === 'pending' || item.status === 'awaiting_supplier' || item.status === 'in_transit') && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={confirmReceipt.isPending}
                    onClick={() => confirmReceipt.mutate(item.id)}
                  >
                    {t('warehouse.supplyReceiving.confirmReceipt')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            {t('warehouse.supplyReceiving.confirmedToday', { count: items.filter((i) => i.status === 'confirmed').length })}
          </span>
        </div>
      )}
    </Card>
  );
}
