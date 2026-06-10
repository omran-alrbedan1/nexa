import { useState } from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToastStore } from '@/stores/toastStore';
import { useStartProcessing, useMarkPacked, usePassQualityCheck } from '../hooks/useAggregation';
import type { AggregationOrder, AggregationStatus } from '../api/aggregationApi';

const STATUS_COLORS: Record<AggregationStatus, 'yellow' | 'blue' | 'green' | 'purple' | 'green'> = {
  queued: 'yellow',
  processing: 'blue',
  packed: 'green',
  quality_check: 'purple',
  completed: 'green',
};

const STATUS_LABELS: Record<AggregationStatus, string> = {
  queued: 'Queued',
  processing: 'Processing',
  packed: 'Packed',
  quality_check: 'Quality Check',
  completed: 'Completed',
};

interface AggregationQueueSectionProps {
  items: AggregationOrder[];
  isLoading: boolean;
}

export function AggregationQueueSection({ items, isLoading }: AggregationQueueSectionProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AggregationStatus | ''>('');
  const startProcessing = useStartProcessing();
  const markPacked = useMarkPacked();
  const passQC = usePassQualityCheck();

  const filtered = items.filter((item) => {
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
            Start Processing
          </Button>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-medium">Assigned: {item.assignedTo}</span>
            <Button
              variant="outline"
              size="sm"
              isLoading={markPacked.isPending}
              onClick={() => markPacked.mutate(item.id)}
            >
              Mark Packed
            </Button>
          </div>
        );
      case 'quality_check':
        return (
          <Button
            variant="primary"
            size="sm"
            isLoading={passQC.isPending}
            onClick={() => passQC.mutate(item.id)}
          >
            Pass QC ✓
          </Button>
        );
      case 'packed':
        return (
          <span className="text-xs text-green-600 font-medium">Awaiting QC</span>
        );
      case 'completed':
        return (
          <span className="text-xs text-gray-400">Moved to Shipping</span>
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
            <h3 className="text-sm font-semibold text-gray-900">Aggregation Queue</h3>
            <p className="text-xs text-gray-500">
              {queuedCount} queued · {items.length} in warehouse
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => useToastStore.getState().addToast('info', 'Priority sorting coming soon')}
          >
            Sort by Priority
          </Button>
        </div>
      </CardHeader>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search order or customer..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AggregationStatus | '')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="quality_check">Quality Check</option>
          <option value="packed">Packed</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Queue is empty"
          description={search ? 'No matching orders found' : 'All orders have been processed'}
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
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{item.regionName}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{item.items}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span>{item.itemCount} items</span>
                  {item.assignedTo && (
                    <>
                      <span>·</span>
                      <span>👤 {item.assignedTo}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                <StatusBadge
                  status={STATUS_LABELS[item.status]}
                  color={STATUS_COLORS[item.status]}
                  dot
                />
                {renderActionButtons(item)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && items.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Avg processing time: 45 min
          </span>
          <button
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            onClick={() => useToastStore.getState().addToast('info', 'Full queue view coming soon')}
          >
            View Full Queue →
          </button>
        </div>
      )}
    </Card>
  );
}
