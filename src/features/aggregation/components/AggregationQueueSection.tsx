import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/contexts/AuthContext';
import { useStartProcessing, useMarkPacked, usePassQualityCheck } from '../hooks/useAggregation';
import { ROUTES } from '@/routes/routes';
import type { AggregationOrder, AggregationStatus } from '../api/aggregationApi';

const STATUS_COLORS: Record<AggregationStatus, 'yellow' | 'blue' | 'green' | 'purple'> = {
  queued: 'yellow',
  processing: 'blue',
  packed: 'purple',
  completed: 'green',
};

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
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AggregationStatus | ''>('');
  const [sortByPriority, setSortByPriority] = useState(false);
  const startProcessing = useStartProcessing();
  const markPacked = useMarkPacked();
  const passQC = usePassQualityCheck();

  const priorityOrder: Record<AggregationStatus, number> = {
    queued: 0, processing: 1, packed: 2, completed: 3,
  };

  const displayItems = [...items];
  if (sortByPriority) {
    displayItems.sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status]);
  }

  const filtered = displayItems.filter((item) => {
    const matchesSearch = !search ||
      item.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.customerName.toLowerCase().includes(search.toLowerCase());
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
            onClick={() => startProcessing.mutate({ orderId: item.id, assignee: user?.name || 'Unassigned' })}
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
      ) : filtered.length === 0 ? (
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
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{item.customerName}</span>
                  <span className="text-xs text-gray-400">{item.orderNumber}</span>
                  {item.parentOrderId && (
                    <button
                      onClick={() => navigate(ROUTES.ORDER_DETAIL(item.parentOrderId!))}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      {t('orders.list.parentOrder')}
                    </button>
                  )}
                  <span className="text-xs text-gray-300">·</span>
                  <StatusBadge
                    status={STATUS_LABELS[item.status]}
                    color={STATUS_COLORS[item.status]}
                    dot
                  />
                </div>
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
