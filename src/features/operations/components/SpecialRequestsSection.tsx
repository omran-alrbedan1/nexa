import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToastStore } from '@/stores/toastStore';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { useAssignForPricing, useSubmitPriceQuote } from '../hooks/useOperations';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
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

interface SpecialRequestsSectionProps {
  requests: SpecialRequest[];
  isLoading: boolean;
}

export function SpecialRequestsSection({ requests, isLoading }: SpecialRequestsSectionProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const STATUS_LABELS: Record<string, string> = {
    pending_management: t('operations.specialRequestStatus.pending_management'),
    pending_pricing: t('operations.specialRequestStatus.pending_pricing'),
    pending_customer_approval: t('operations.specialRequestStatus.pending_customer_approval'),
    priced: t('operations.specialRequestStatus.priced'),
    approved: t('operations.specialRequestStatus.approved'),
    rejected: t('operations.specialRequestStatus.rejected'),
    cancelled: t('operations.specialRequestStatus.cancelled'),
  };
  const formatPrice = useFormatPrice();
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
          ? r.assignedTo === user?.full_name
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
      useToastStore.getState().addToast('error', t('operations.specialRequests.enterValidPrice'));
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
    assignForPricing.mutate({ requestId, assignedTo: user?.full_name || 'Operations Staff' });
  };

  return (
    <>
      <Card padding="md">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{t('operations.specialRequests.title')}</h3>
              <p className="text-xs text-gray-500">
                {t('operations.specialRequests.pendingActions', { count: requests.filter((r) => r.status === 'pending_management' || r.status === 'pending_pricing').length })}
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['all', 'mine', 'unassigned'] as const).map((ft) => (
              <button
                key={ft}
                onClick={() => setTypeFilter(ft)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  typeFilter === ft
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {ft === 'all' ? t('operations.specialRequests.all') : ft === 'mine' ? t('operations.specialRequests.mine') : t('operations.specialRequests.unassigned')}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('operations.specialRequests.allStatuses')}</option>
            <option value="pending_management">{t('operations.specialRequests.pendingReview')}</option>
            <option value="pending_pricing">{t('operations.specialRequests.needsPricing')}</option>
            <option value="pending_customer_approval">{t('operations.specialRequests.awaitingCustomer')}</option>
            <option value="priced">{t('operations.specialRequests.priced')}</option>
            <option value="approved">{t('operations.specialRequests.approved')}</option>
            <option value="rejected">{t('operations.specialRequests.rejected')}</option>
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
            title={t('operations.specialRequests.noRequests')}
            description={
              typeFilter === 'mine'
                ? t('operations.specialRequests.noAssigned')
                : typeFilter === 'unassigned'
                  ? t('operations.specialRequests.allAssigned')
                  : t('operations.specialRequests.noFilterMatch')
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="py-3 px-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(ROUTES.SPECIAL_REQUEST_DETAIL(req.id))}
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
                        {t('operations.specialRequests.assignedTo', { name: req.assignedTo })}
                      </span>
                    ) : (
                      <Badge variant="yellow" size="sm">{t('operations.specialRequests.unassigned')}</Badge>
                    )}
                  </div>
                </div>

                {/* Request details */}
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{req.requestDetails}</p>

                {/* Budget + price info */}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  {req.estimatedBudget && (
                    <span>{t('operations.specialRequests.budget', { amount: req.estimatedBudget })}</span>
                  )}
                  {req.priceQuote && (
                    <span>{t('operations.specialRequests.quote', { amount: req.priceQuote })}</span>
                  )}
                  {req.notes && (
                    <span className="truncate max-w-[200px]" title={req.notes}>
                      {t('operations.specialRequests.note', { note: req.notes })}
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
                      onClick={(e) => { e.stopPropagation(); handleAssign(req.id); }}
                    >
                      {t('operations.specialRequests.assignToMe')}
                    </Button>
                  )}
                  {req.status === 'pending_pricing' && req.assignedTo === user?.full_name && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); openPricingModal(req); }}
                    >
                      {t('operations.specialRequests.setPriceQuote')}
                    </Button>
                  )}
                  {req.status === 'pending_customer_approval' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="yellow" size="sm">{t('operations.specialRequests.awaitingCustomer')}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(ROUTES.SPECIAL_REQUEST_DETAIL(req.id));
                        }}
                      >
                        {t('operations.specialRequests.followUp')}
                      </Button>
                    </div>
                  )}
                  {req.priceQuote && req.status !== 'pending_customer_approval' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); openPricingModal(req); }}
                    >
                      {t('operations.specialRequests.updateQuote')}
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
              {requests.filter((r) => r.status === 'pending_pricing').length} {t('operations.specialRequests.needsPricing')} ·{' '}
              {requests.filter((r) => r.status === 'pending_customer_approval').length} {t('operations.specialRequests.awaitingCustomer')}
            </span>
            <button
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            onClick={() => navigate(ROUTES.OPERATIONS)}
          >
            {t('operations.specialRequests.viewAllRequests')} →
            </button>
          </div>
        )}
      </Card>

      {/* Pricing Modal */}
      <Modal
        open={pricingModal.open}
        onClose={() => setPricingModal({ ...pricingModal, open: false })}
        title={t('operations.specialRequests.pricingModalTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('operations.specialRequests.customer')}</label>
            <p className="text-sm text-gray-900">{pricingModal.request?.customerName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('operations.specialRequests.request')}</label>
            <p className="text-sm text-gray-600">{pricingModal.request?.requestDetails}</p>
          </div>
          {pricingModal.request?.estimatedBudget && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('operations.specialRequests.estimatedBudget')}</label>
              <p className="text-sm text-gray-900">{formatPrice(pricingModal.request.estimatedBudget)}</p>
            </div>
          )}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              {t('operations.specialRequests.priceQuote')}
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={pricingModal.price}
              onChange={(e) => setPricingModal({ ...pricingModal, price: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('operations.specialRequests.pricePlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              {t('operations.specialRequests.notes')}
            </label>
            <textarea
              id="notes"
              rows={3}
              value={pricingModal.notes}
              onChange={(e) => setPricingModal({ ...pricingModal, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={t('operations.specialRequests.notesPlaceholder')}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPricingModal({ ...pricingModal, open: false })}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={submitQuote.isPending}
              onClick={handleSubmitQuote}
            >
              {t('operations.specialRequests.submitQuote')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
