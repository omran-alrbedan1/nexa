import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { useStartProcessing, useMarkPacked, usePassQualityCheck } from '../hooks/useAggregation';
import { OrderParts } from './OrderParts';
import { ROUTES } from '@/routes/routes';
import type { AggregationOrder, AggregationStatus, OrderGroup, OrderPart } from '../api/aggregationApi';

const STATUS_COLORS: Record<AggregationStatus, 'yellow' | 'blue' | 'green' | 'purple'> = {
  queued: 'yellow',
  processing: 'blue',
  packed: 'purple',
  completed: 'green',
};

interface AggregateGroup {
  group: OrderGroup;
  items: AggregationOrder[];
}

interface AggregationQueueSectionProps {
  items: AggregationOrder[];
  isLoading: boolean;
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
  onPageChange: (page: number) => void;
}

export function AggregationQueueSection({ items, isLoading, meta, onPageChange }: AggregationQueueSectionProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const STATUS_LABELS: Record<AggregationStatus, string> = {
    queued: t('warehouse.aggregationQueue.queued'),
    processing: t('warehouse.aggregationQueue.processing'),
    packed: t('warehouse.aggregationQueue.packed'),
    completed: t('warehouse.aggregationQueue.completed'),
  };
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AggregationStatus | ''>('');
  const [sortByPriority, setSortByPriority] = useState(false);
  const startProcessing = useStartProcessing();
  const markPacked = useMarkPacked();
  const passQC = usePassQualityCheck();

  const priorityOrder: Record<AggregationStatus, number> = {
    queued: 0, processing: 1, packed: 2, completed: 3,
  };

  const { groups, singles } = useMemo(() => {
    const gs: AggregateGroup[] = [];
    const ss: AggregationOrder[] = [];
    for (const item of items) {
      const grp = item.group;
      if (grp) {
        const existing = gs.find((g) => g.group.id === grp.id);
        if (existing) existing.items.push(item);
        else gs.push({ group: grp, items: [item] });
      } else {
        ss.push(item);
      }
    }
    return { groups: gs, singles: ss };
  }, [items]);

  const displayGroups = [...groups];
  const displaySingles = [...singles];
  if (sortByPriority) {
    displayGroups.sort((a, b) => priorityOrder[a.items[0].status] - priorityOrder[b.items[0].status]);
    displaySingles.sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status]);
  }

  const matches = (item: AggregationOrder, q: string) =>
    item.orderNumber.toLowerCase().includes(q) || item.customerName.toLowerCase().includes(q) || item.regionName.toLowerCase().includes(q);

  const filteredGroups = displayGroups.filter((g) => {
    const matchesSearch = !search || g.items.some((i) => matches(i, search.toLowerCase())) || g.group.orders.some((o) => o.orderNumber.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || g.items.some((i) => i.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const filteredSingles = displaySingles.filter((item) => {
    const matchesSearch = !search || matches(item, search.toLowerCase());
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const queuedCount = items.filter((i) => i.status === 'queued').length;

  const renderActionButtons = (item: AggregationOrder) => {
    switch (item.status) {
      case 'queued':
        return (
          <Button
            variant="primary"
            size="sm"
            isLoading={startProcessing.isPending}
            onClick={() => startProcessing.mutate(item.id)}
          >
            {t('warehouse.aggregationQueue.startProcessing')}
          </Button>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-medium">{t('warehouse.aggregationQueue.assigned', { name: item.assignedTo })}</span>
            <Button
              variant="outline"
              size="sm"
              isLoading={markPacked.isPending}
              onClick={() => markPacked.mutate(item.id)}
            >
              {t('warehouse.aggregationQueue.markPacked')}
            </Button>
          </div>
        );
      case 'packed':
        return (
          <Button
            variant="primary"
            size="sm"
            isLoading={passQC.isPending}
            onClick={() => passQC.mutate(item.id)}
          >
            {t('warehouse.aggregationQueue.passQC')}
          </Button>
        );
      case 'completed':
        return (
          <span className="text-xs text-gray-400">{t('warehouse.aggregationQueue.movedToShipping')}</span>
        );
      default:
        return null;
    }
  };

  const partLabel = (part: OrderPart) => {
    if (['READY_TO_SHIP', 'READY_TO_DELIVER', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(part.status)) {
      return t('warehouse.parts.statusReady');
    }
    if (part.status === 'IN_AGGREGATION') {
      return t('warehouse.parts.statusInAggregation');
    }
    return t('warehouse.parts.statusInSupply');
  };

  const renderGroupCard = (g: AggregateGroup) => {
    const numbers = g.items.map((i) => i.orderNumber).join(' / ');
    const itemForPart = (part: OrderPart) => g.items.find((i) => i.orderId === part.id);

    return (
      <div
        key={g.group.id}
        className="flex flex-col py-3 px-4 rounded-lg border border-purple-200 bg-purple-50/30 hover:bg-purple-50/60 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(ROUTES.ORDER_DETAIL(g.group.id))}
                className="text-sm font-medium text-gray-900 hover:text-purple-700 transition-colors"
              >
                {g.items[0]?.customerName}
              </button>
              <span className="text-xs text-gray-400">{numbers}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
              <span>{t('warehouse.aggregationQueue.itemsCount', { count: g.items.reduce((s, i) => s + i.itemCount, 0) })}</span>
              <span>·</span>
              <span>{g.items[0]?.regionName}</span>
            </div>
          </div>
        </div>

        <OrderParts
          members={g.group.orders}
          progressLabel={t('warehouse.parts.done', { done: g.group.done, total: g.group.total })}
          renderMember={(part) => {
            const item = itemForPart(part);
            return (
              <>
                <span className="text-gray-500 font-medium">{partLabel(part)}</span>
                {item && <div className="ml-2">{renderActionButtons(item)}</div>}
              </>
            );
          }}
          defaultOpen
        />
      </div>
    );
  };

  return (
    <Card padding="md">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('warehouse.aggregationQueue.title')}</h3>
            <p className="text-xs text-gray-500">
              {t('warehouse.aggregationQueue.queuedCount', { count: queuedCount })} · {t('warehouse.aggregationQueue.inWarehouse', { count: items.length })}
            </p>
          </div>
          <Button
            variant={sortByPriority ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSortByPriority(!sortByPriority)}
          >
            {sortByPriority ? t('warehouse.aggregationQueue.sorted') : t('warehouse.aggregationQueue.sortByPriority')}
          </Button>
        </div>
      </CardHeader>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('warehouse.aggregationQueue.searchPlaceholder')}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AggregationStatus | '')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('warehouse.aggregationQueue.allStatuses')}</option>
          <option value="queued">{t('warehouse.aggregationQueue.queued')}</option>
          <option value="processing">{t('warehouse.aggregationQueue.processing')}</option>
          <option value="packed">{t('warehouse.aggregationQueue.packed')}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      ) : filteredGroups.length === 0 && filteredSingles.length === 0 ? (
        <EmptyState
          title={t('warehouse.aggregationQueue.queueEmpty')}
          description={search ? t('warehouse.aggregationQueue.noMatchingOrders') : t('warehouse.aggregationQueue.allProcessed')}
          icon={
            <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredGroups.map(renderGroupCard)}
          {filteredSingles.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{item.customerName}</span>
                  <span className="text-xs text-gray-400">{item.orderNumber}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <StatusBadge
                    status={STATUS_LABELS[item.status]}
                    color={STATUS_COLORS[item.status]}
                    dot
                  />
                </div>
                {item.parentOrderId && (
                  <button
                    onClick={() => navigate(ROUTES.ORDER_DETAIL(item.parentOrderId!))}
                    className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-left"
                  >
                    <span>
                      {t('orders.multiSupplier.partOf')} {item.parentOrderNumber ? `(${item.parentOrderNumber})` : ''}
                    </span>
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{item.items}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span>{t('warehouse.aggregationQueue.itemsCount', { count: item.itemCount })}</span>
                  {item.totalWeight > 0 && (
                    <>
                      <span>·</span>
                      <span>{t('warehouse.aggregationQueue.weight', { weight: item.totalWeight })}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{item.regionName}</span>
                  {item.assignedTo && (
                    <>
                      <span>·</span>
                      <span>👤 {item.assignedTo}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                {renderActionButtons(item)}
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
        onPageChange={onPageChange}
      />
    </Card>
  );
}
