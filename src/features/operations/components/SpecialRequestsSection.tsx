import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToastStore } from '@/stores/toastStore';
import { useAssignForPricing, useSubmitPriceQuote } from '../hooks/useOperations';
import type { SpecialRequest } from '../api/operationsApi';

const STATUS_COLORS: Record<string, 'yellow' | 'blue' | 'green' | 'red' | 'purple'> = {
  pending_management: 'yellow',
  pending_pricing: 'yellow',
  pending_customer_approval: 'blue',
  priced: 'purple',
  approved: 'green',
  rejected: 'red',
  cancelled: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  pending_management: 'Pending Review',
  pending_pricing: 'Needs Pricing',
  pending_customer_approval: 'Awaiting Customer',
  priced: 'Priced',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

interface SpecialRequestsSectionProps {
  requests: SpecialRequest[];
  isLoading: boolean;
}

export function SpecialRequestsSection({ requests, isLoading }: SpecialRequestsSectionProps) {
  const { user } = useAuth();
  const assignForPricing = useAssignForPricing();
  const submitQuote = useSubmitPriceQuote();

  const [pricingModal, setPricingModal] = useState<{
    open: boolean;
    request: SpecialRequest | null;
    price: string;
    notes: string;
  }>({ open: false, request: null, price: '', notes: '' });

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mine' | 'unassigned'>('all');

  const filtered = requests.filter((r) => {
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesType =
      typeFilter === 'all'
        ? true
        : typeFilter === 'mine'
          ? r.assignedTo === user?.name
          : !r.assignedTo;
    return matchesStatus && matchesType;
  });

  const openPricingModal = (request: SpecialRequest) => {
    setPricingModal({
      open: true,
      request,
      price: request.priceQuote?.toString() || '',
      notes: request.notes || '',
    });
  };

  const handleSubmitQuote = () => {
    if (!pricingModal.request) return;
    const price = parseFloat(pricingModal.price);
    if (isNaN(price) || price <= 0) {
      useToastStore.getState().addToast('error', 'Please enter a valid price');
      return;
    }
    submitQuote.mutate(
      {
        requestId: pricingModal.request.id,
        price,
        notes: pricingModal.notes,
      },
      {
        onSuccess: () => {
          setPricingModal({ open: false, request: null, price: '', notes: '' });
        },
      }
    );
  };

  const handleAssign = (requestId: number) => {
    assignForPricing.mutate({ requestId, assignedTo: user?.name || 'Operations Staff' });
  };

  return (
    <>
      <Card padding="md">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Special Requests</h3>
              <p className="text-xs text-gray-500">
                {requests.filter((r) => r.status === 'pending_management' || r.status === 'pending_pricing').length} pending actions
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['all', 'mine', 'unassigned'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  typeFilter === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'all' ? 'All' : t === 'mine' ? 'Mine' : 'Unassigned'}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending_management">Pending Review</option>
            <option value="pending_pricing">Needs Pricing</option>
            <option value="pending_customer_approval">Awaiting Customer</option>
            <option value="priced">Priced</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No special requests"
            description={
              typeFilter === 'mine'
                ? 'You have no assigned special requests'
                : typeFilter === 'unassigned'
                  ? 'All requests are assigned'
                  : 'No special requests match the filter'
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="py-3 px-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{req.orderNumber}</span>
                      <StatusBadge
                        status={STATUS_LABELS[req.status]}
                        color={STATUS_COLORS[req.status] || 'blue'}
                      />
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {req.customerName}
                      <span className="text-gray-400 mx-1">·</span>
                      {req.customerPhone}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {req.assignedTo ? (
                      <span className="text-xs text-gray-400">
                        Assigned to: <span className="font-medium text-gray-600">{req.assignedTo}</span>
                      </span>
                    ) : (
                      <Badge variant="yellow" size="sm">Unassigned</Badge>
                    )}
                  </div>
                </div>

                {/* Request details */}
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{req.requestDetails}</p>

                {/* Budget + price info */}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  {req.estimatedBudget && (
                    <span>Budget: <span className="font-medium">{req.estimatedBudget} SAR</span></span>
                  )}
                  {req.priceQuote && (
                    <span>Quote: <span className="font-medium text-blue-600">{req.priceQuote} SAR</span></span>
                  )}
                  {req.notes && (
                    <span className="truncate max-w-[200px]" title={req.notes}>
                      Note: {req.notes}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-3">
                  {req.status === 'pending_management' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={assignForPricing.isPending}
                      onClick={() => handleAssign(req.id)}
                    >
                      Assign to Me
                    </Button>
                  )}
                  {req.status === 'pending_pricing' && req.assignedTo === user?.name && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openPricingModal(req)}
                    >
                      Set Price Quote
                    </Button>
                  )}
                  {req.status === 'pending_customer_approval' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="yellow" size="sm">Awaiting Customer</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          useToastStore.getState().addToast(
                            'info',
                            'Customer approval tracking coming soon'
                          )
                        }
                      >
                        Follow Up
                      </Button>
                    </div>
                  )}
                  {req.priceQuote && req.status !== 'pending_customer_approval' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPricingModal(req)}
                    >
                      Update Quote
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!isLoading && requests.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              {requests.filter((r) => r.status === 'pending_pricing').length} pending pricing ·{' '}
              {requests.filter((r) => r.status === 'pending_customer_approval').length} awaiting customer
            </span>
            <button
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              onClick={() => useToastStore.getState().addToast('info', 'Full special requests page coming soon')}
            >
              View All Requests →
            </button>
          </div>
        )}
      </Card>

      {/* Pricing Modal */}
      <Modal
        open={pricingModal.open}
        onClose={() => setPricingModal({ ...pricingModal, open: false })}
        title="Set Price Quote"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <p className="text-sm text-gray-900">{pricingModal.request?.customerName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request</label>
            <p className="text-sm text-gray-600">{pricingModal.request?.requestDetails}</p>
          </div>
          {pricingModal.request?.estimatedBudget && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Budget</label>
              <p className="text-sm text-gray-900">{pricingModal.request.estimatedBudget} SAR</p>
            </div>
          )}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price Quote (SAR)
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={pricingModal.price}
              onChange={(e) => setPricingModal({ ...pricingModal, price: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={pricingModal.notes}
              onChange={(e) => setPricingModal({ ...pricingModal, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add any notes about pricing, availability, etc."
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPricingModal({ ...pricingModal, open: false })}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={submitQuote.isPending}
              onClick={handleSubmitQuote}
            >
              Submit Quote
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
