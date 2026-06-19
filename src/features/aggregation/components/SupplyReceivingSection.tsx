import { useState } from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/stores/toastStore';
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

const STATUS_LABELS: Record<SupplyStatus, string> = {
  pending: 'Pending',
  awaiting_supplier: 'Awaiting Supplier',
  in_transit: 'In Transit',
  confirmed: 'Confirmed',
  partial: 'Partially Received',
  cancelled: 'Cancelled',
};

interface SupplyReceivingSectionProps {
  items: WarehouseSupplyItem[];
  isLoading: boolean;
}

export function SupplyReceivingSection({ items, isLoading }: SupplyReceivingSectionProps) {
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
            <h3 className="text-sm font-semibold text-gray-900">Supply Receiving</h3>
            <p className="text-xs text-gray-500">
              {pendingCount} pending delivery · {items.length} total
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => useToastStore.getState().addToast('info', 'New purchase order form coming soon')}
          >
            + New Purchase Order
          </Button>
        </div>
      </CardHeader>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search supplier or PO..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SupplyStatus | '')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="awaiting_supplier">Awaiting Supplier</option>
          <option value="in_transit">In Transit</option>
          <option value="confirmed">Confirmed</option>
          <option value="partial">Partial</option>
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
          title="No supply items"
          description={search ? 'Try a different search term' : 'No incoming deliveries scheduled'}
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
                  <span>{item.itemCount} items</span>
                  {item.eta && (
                    <>
                      <span>·</span>
                      <span>ETA: {new Date(item.eta).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
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
                    Confirm Receipt
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary bar */}
      {!isLoading && items.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            {items.filter((i) => i.status === 'confirmed').length} confirmed today
          </span>
          <button
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            onClick={() => useToastStore.getState().addToast('info', 'Purchase Orders page coming soon')}
          >
            View All Purchase Orders →
          </button>
        </div>
      )}
    </Card>
  );
}
