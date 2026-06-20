import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { operationsApi, type SpecialRequest } from '../api/operationsApi';
import { useAssignForPricing, useSubmitPriceQuote, useApproveSpecialOrder, useRejectSpecialOrder, useConvertToOrder } from '../hooks/useOperations';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import {
  ArrowLeft, FileClock, DollarSign, User, Calendar,
  CheckCircle2, Phone, XCircle,
} from 'lucide-react';
import { operationsKeys } from '../hooks/useOperations';

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'teal' | 'purple'> = {
  pending_management: 'purple',
  pending_pricing: 'yellow',
  pending_customer_approval: 'yellow',
  priced: 'teal',
  approved: 'green',
  rejected: 'red',
  cancelled: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  pending_management: 'Pending Mgmt',
  pending_pricing: 'Pending Pricing',
  pending_customer_approval: 'Awaiting Customer',
  priced: 'Priced',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function SpecialRequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const id = parseInt(requestId || '0', 10);
  const queryClient = useQueryClient();

  const { data: request, isLoading, isError, error, refetch } = useQuery<SpecialRequest>({
    queryKey: [...operationsKeys.all, 'special-requests', 'detail', id],
    queryFn: async () => {
      const response = await operationsApi.getSpecialRequests();
      const req = response.data.find((r) => r.id === id);
      if (!req) throw new Error('Request not found');
      return req;
    },
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });

  const assignForPricing = useAssignForPricing();
  const submitPriceQuote = useSubmitPriceQuote();
  const approveSpecialOrder = useApproveSpecialOrder();
  const rejectSpecialOrder = useRejectSpecialOrder();
  const convertToOrder = useConvertToOrder();
  const [assignModal, setAssignModal] = useState(false);
  const [quoteModal, setQuoteModal] = useState<{ open: boolean; price: string; notes: string }>({ open: false, price: '', notes: '' });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.OPERATIONS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> Back to Operations
        </button>
        <ErrorState title="Failed to load request" message={error instanceof Error ? error.message : 'An error occurred'} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !request) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const handlePriceQuote = () => {
    if (!quoteModal.price) return;
    submitPriceQuote.mutate({
      requestId: request.id,
      price: parseFloat(quoteModal.price),
      notes: quoteModal.notes,
    });
    setQuoteModal({ open: false, price: '', notes: '' });
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <button onClick={() => navigate(ROUTES.OPERATIONS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Operations
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <FileClock size={24} className="text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-extrabold text-text-primary font-display">{request.orderNumber}</h1>
                <Badge variant={STATUS_BADGE[request.status] || 'yellow'} size="sm">{STATUS_LABELS[request.status]}</Badge>
              </div>
              <p className="text-sm text-text-secondary font-body mt-1">Special Request · {request.customerName}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {request.status === 'pending_management' && (
                <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} onClick={() => { assignForPricing.mutate({ requestId: request.id, assignedTo: 'Operations Staff' }); }}>
                  Assign for Pricing
                </Button>
              )}
              {(request.status === 'pending_management' || request.status === 'pending_pricing') && (
                <Button variant="primary" size="sm" leftIcon={<DollarSign size={14} />} onClick={() => setQuoteModal({ open: true, price: String(request.estimatedBudget || ''), notes: '' })}>
                  Set Price Quote
                </Button>
              )}
              {request.status === 'pending_customer_approval' && (
                <>
                  <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} isLoading={approveSpecialOrder.isPending} onClick={() => approveSpecialOrder.mutate(request.id)}>
                    Approve
                  </Button>
                  <Button variant="secondary" size="sm" leftIcon={<XCircle size={14} />} isLoading={rejectSpecialOrder.isPending} onClick={() => rejectSpecialOrder.mutate(request.id)}>
                    Reject
                  </Button>
                </>
              )}
              {request.status === 'approved' && (
                <Button variant="primary" size="sm" leftIcon={<ArrowLeft size={14} />} isLoading={convertToOrder.isPending} onClick={() => convertToOrder.mutate(request.id)}>
                  Convert to Order
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <h3 className="text-sm font-bold text-text-primary font-display mb-3">Request Details</h3>
            <p className="text-sm text-text-primary font-body leading-relaxed">{request.requestDetails}</p>
            <div className="flex items-center gap-3 mt-4 text-xs text-text-tertiary font-body">
              <Calendar size={12} /> {new Date(request.createdAt).toLocaleString()}
            </div>
          </Card>

          {/* Pricing Timeline */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-brand-primary" />
              <h3 className="text-sm font-bold text-text-primary font-display">Pricing Timeline</h3>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-default" />
              {[
                { status: 'Request Created', time: request.createdAt, desc: 'Customer submitted request' },
                ...(request.status !== 'pending_management' ? [{ status: 'Assigned for Pricing', time: request.updatedAt, desc: `Assigned to ${request.assignedTo || 'staff'}` }] : []),
                ...(request.priceQuote ? [{ status: 'Price Quote Submitted', time: request.updatedAt, desc: `${request.priceQuote} SAR — awaiting customer approval` }] : []),
              ].map((step, idx, arr) => (
                <div key={idx} className="relative pb-6 last:pb-0">
                  <div className={cn(
                    'absolute -left-[23px] w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center',
                    idx === arr.length - 1 ? 'bg-brand-primary' : 'bg-white'
                  )}>
                    <div className={cn('w-2 h-2 rounded-full', idx === arr.length - 1 ? 'bg-white' : 'bg-border-default')} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary font-body">{step.status}</span>
                    <span className="text-xs text-text-tertiary font-body ml-2">{new Date(step.time).toLocaleDateString()}</span>
                    <p className="text-xs text-text-secondary font-body mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="md">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 font-body">Customer</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-text-tertiary" />
                <span className="font-bold text-text-primary">{request.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-text-tertiary" />
                <span className="text-text-primary">{request.customerPhone}</span>
              </div>
            </div>
            {request.assignedTo && (
              <div className="mt-3 pt-3 border-t border-border-default/50">
                <span className="text-xs text-text-secondary">Assigned: <span className="font-bold text-text-primary">{request.assignedTo}</span></span>
              </div>
            )}
          </Card>

          <Card padding="md">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 font-body">Budget & Pricing</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Est. Budget</span>
                <span className="font-bold text-text-primary">{request.estimatedBudget ? `${request.estimatedBudget} SAR` : '—'}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border-default/50">
                <span className="text-text-secondary">Price Quote</span>
                <span className={request.priceQuote ? 'font-extrabold text-brand-accent' : 'text-text-tertiary'}>
                  {request.priceQuote ? `${request.priceQuote} SAR` : 'Pending'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title={`Assign ${request.orderNumber}`}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">Assign this request for pricing.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" isLoading={assignForPricing.isPending} onClick={() => {
              assignForPricing.mutate({ requestId: request.id, assignedTo: 'Operations Staff' });
              setAssignModal(false);
            }}>Assign</Button>
          </div>
        </div>
      </Modal>

      {/* Quote Modal */}
      <Modal open={quoteModal.open} onClose={() => setQuoteModal({ ...quoteModal, open: false })} title={`Set Price Quote — ${request.orderNumber}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-text-secondary font-body mb-1">Price (SAR)</label>
            <input type="number" step="0.5" min="0" value={quoteModal.price}
              onChange={(e) => setQuoteModal({ ...quoteModal, price: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary bg-bg-input" />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-secondary font-body mb-1">Notes</label>
            <textarea rows={3} value={quoteModal.notes}
              onChange={(e) => setQuoteModal({ ...quoteModal, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary resize-none bg-bg-input"
              placeholder="Additional notes about pricing..." />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setQuoteModal({ ...quoteModal, open: false })}>Cancel</Button>
            <Button variant="primary" size="sm" isLoading={submitPriceQuote.isPending} onClick={handlePriceQuote}>Submit Quote</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
