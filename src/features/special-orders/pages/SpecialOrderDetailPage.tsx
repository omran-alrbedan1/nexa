import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useSpecialOrderDetail, useAssignStaff, useAssignSupplier, useApproveSpecialOrder, useRejectSpecialOrder, useUpdateNotes, useConvertToOrder, useSubmitPriceQuote } from '../hooks/useSpecialOrders';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import {
  ArrowLeft, FileClock, User, Phone, Package, DollarSign,
  CheckCircle2, XCircle, Calendar, MessageSquare,
  Building2, Pencil, RefreshCw, BadgePercent,
} from 'lucide-react';

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'purple' | 'teal'> = {
  pending_admin: 'purple',
  pending_pricing: 'yellow',
  pending_customer: 'teal',
  priced: 'teal',
  approved: 'green',
  rejected: 'red',
  cancelled: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  pending_admin: 'Pending Admin',
  pending_pricing: 'Pending Pricing',
  pending_customer: 'Awaiting Customer',
  priced: 'Priced',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function SpecialOrderDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const id = parseInt(requestId || '0', 10);
  const { t } = useTranslation();
  const formatPrice = useCurrencyStore(s => s.formatPrice);

  const { data: order, isLoading, isError, error, refetch } = useSpecialOrderDetail(id);
  const assignStaff = useAssignStaff();
  const assignSupplier = useAssignSupplier();
  const approveOrder = useApproveSpecialOrder();
  const rejectOrder = useRejectSpecialOrder();
  const updateNotes = useUpdateNotes();
  const convertOrder = useConvertToOrder();
  const submitPriceQuote = useSubmitPriceQuote();

  const [notesModal, setNotesModal] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [priceQuoteModal, setPriceQuoteModal] = useState(false);
  const [priceAmount, setPriceAmount] = useState('');
  const [priceNotes, setPriceNotes] = useState('');
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; reason: string }>({ open: false, reason: '' });
  const [assignStaffModal, setAssignStaffModal] = useState<{ open: boolean; userId: string }>({ open: false, userId: '' });
  const [assignSupplierModal, setAssignSupplierModal] = useState<{ open: boolean; supplierId: string }>({ open: false, supplierId: '' });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.SPECIAL_ORDERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('specialOrders.detail.back')}
        </button>
        <ErrorState title={t('specialOrders.detail.errorTitle')} message={error instanceof Error ? error.message : ''} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !order) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-5">
            <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = () => {
    approveOrder.mutate({ id: order.id }, { onSuccess: () => setApproveModal(false) });
  };

  const handleReject = () => {
    if (rejectModal.reason.trim()) {
      rejectOrder.mutate({ id: order.id, reason: rejectModal.reason }, { onSuccess: () => setRejectModal({ open: false, reason: '' }) });
    }
  };

  const handleAssignStaff = () => {
    const staffId = parseInt(assignStaffModal.userId);
    if (staffId > 0) {
      assignStaff.mutate({ id: order.id, staffUserId: staffId }, { onSuccess: () => setAssignStaffModal({ open: false, userId: '' }) });
    }
  };

  const handleAssignSupplier = () => {
    const supplierId = parseInt(assignSupplierModal.supplierId);
    if (supplierId > 0) {
      assignSupplier.mutate({ id: order.id, supplierId }, { onSuccess: () => setAssignSupplierModal({ open: false, supplierId: '' }) });
    }
  };

  const handleUpdateNotes = () => {
    updateNotes.mutate({ id: order.id, notes: notesText }, { onSuccess: () => setNotesModal(false) });
  };

  const openNotesModal = () => {
    setNotesText(order.internalNotes);
    setNotesModal(true);
  };

  // Build workflow timeline steps
  const timelineSteps = [
    { status: 'Created', time: order.createdAt, desc: 'Special order request submitted', done: true },
    ...(order.status !== 'pending_admin' ? [{ status: 'Assigned', time: order.updatedAt, desc: order.assignedSupplier ? `Assigned to ${order.assignedSupplier.businessName}` : 'Staff assigned', done: true }] : []),
    ...(order.priceQuotes.length > 0 ? [{ status: 'Priced', time: order.updatedAt, desc: `${formatPrice(order.priceQuotes[0].total)} quote submitted`, done: true }] : []),
    ...(order.status === 'approved' ? [{ status: 'Approved', time: order.updatedAt, desc: 'Order approved', done: true }] : []),
    ...(order.status === 'rejected' ? [{ status: 'Rejected', time: order.updatedAt, desc: order.rejectionReason || 'Rejected', done: true }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <button onClick={() => navigate(ROUTES.SPECIAL_ORDERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('specialOrders.detail.back')}
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-amber-500/10 via-amber-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <FileClock size={24} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-extrabold text-text-primary font-display">{order.referenceNumber}</h1>
                <Badge variant={STATUS_BADGE[order.status] || 'yellow'} size="sm">{STATUS_LABELS[order.status]}</Badge>
              </div>
              <p className="text-sm text-text-secondary font-body mt-1">{t('specialOrders.detail.specialRequest')} · {order.customer?.fullName || 'Unknown'}</p>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {order.status === 'pending_admin' && (
                <>
                  <Button variant="outline" size="sm" leftIcon={<Building2 size={14} />} onClick={() => setAssignSupplierModal({ open: true, supplierId: '' })}>
                    {t('specialOrders.detail.assignSupplier')}
                  </Button>
                  <Button variant="secondary" size="sm" leftIcon={<User size={14} />} onClick={() => setAssignStaffModal({ open: true, userId: '' })}>
                    {t('specialOrders.detail.assignStaff')}
                  </Button>
                  <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} onClick={() => setApproveModal(true)}>
                    {t('specialOrders.detail.approve')}
                  </Button>
                  <Button variant="secondary" size="sm" leftIcon={<XCircle size={14} />} onClick={() => setRejectModal({ open: true, reason: '' })}>
                    {t('specialOrders.detail.reject')}
                  </Button>
                </>
              )}
              {order.status === 'pending_customer' && (
                <>
                  <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} isLoading={approveOrder.isPending} onClick={() => approveOrder.mutate({ id: order.id })}>
                    {t('specialOrders.detail.approve')}
                  </Button>
                  <Button variant="secondary" size="sm" leftIcon={<XCircle size={14} />} isLoading={rejectOrder.isPending} onClick={() => setRejectModal({ open: true, reason: '' })}>
                    {t('specialOrders.detail.reject')}
                  </Button>
                </>
              )}
              {order.status === 'approved' && (
                <Button variant="primary" size="sm" leftIcon={<RefreshCw size={14} />} isLoading={convertOrder.isPending} onClick={() => convertOrder.mutate(order.id)}>
                  {t('specialOrders.detail.convertToOrder')}
                </Button>
              )}
              {order.status === 'pending_pricing' && (
                <>
                  <Button variant="primary" size="sm" leftIcon={<BadgePercent size={14} />} onClick={() => {
                    setPriceAmount(order.priceQuotes.length > 0 ? String(order.priceQuotes[0].total) : '');
                    setPriceNotes('');
                    setPriceQuoteModal(true);
                  }}>
                    {t('specialOrders.detail.submitPriceQuote')}
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<Pencil size={14} />} onClick={openNotesModal}>
                    {t('specialOrders.detail.updateNotes')}
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" leftIcon={<Pencil size={14} />} onClick={openNotesModal}>
                {t('specialOrders.detail.notes')}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-amber-500 via-brand-primary to-amber-500 rounded-full opacity-30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Items + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Notes */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-amber-600" />
              <h3 className="text-sm font-bold text-text-primary font-display">{t('specialOrders.detail.customerNotes')}</h3>
            </div>
            <p className="text-sm text-text-primary font-body leading-relaxed">{order.customerNotes || t('specialOrders.detail.noNotes')}</p>
          </Card>

          {/* Items */}
          {order.items.length > 0 && (
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-amber-600" />
                <h3 className="text-sm font-bold text-text-primary font-display">{t('specialOrders.detail.items')} ({order.items.length})</h3>
              </div>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-border-default/60">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-text-primary font-body">{item.name}</span>
                        <p className="text-xs text-text-tertiary font-body mt-0.5">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <span className="text-xs font-bold text-text-primary">{item.quantity} {item.unit}</span>
                      </div>
                    </div>
                    {item.customerNote && (
                      <p className="text-xs text-text-secondary font-body mt-1.5 italic">"{item.customerNote}"</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Price Quotes */}
          {order.priceQuotes.length > 0 && (
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={16} className="text-amber-600" />
                <h3 className="text-sm font-bold text-text-primary font-display">{t('specialOrders.detail.priceQuotes')}</h3>
              </div>
              <div className="space-y-2">
                {order.priceQuotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-section-alt">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-primary font-body">{quote.quoteNumber}</span>
                      <Badge variant={quote.status === 'accepted' ? 'green' : quote.status === 'rejected' ? 'red' : 'yellow'} size="sm">{quote.status}</Badge>
                    </div>
                    <span className="text-sm font-extrabold text-brand-accent">{formatPrice(quote.total)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-amber-600" />
              <h3 className="text-sm font-bold text-text-primary font-display">{t('specialOrders.detail.timeline')}</h3>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-default" />
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative pb-8 last:pb-0">
                  <div className={cn(
                    'absolute -left-[23px] w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center',
                    step.done ? 'bg-brand-primary' : 'bg-gray-200'
                  )}>
                    <div className={cn('w-2 h-2 rounded-full', step.done ? 'bg-white' : 'bg-gray-400')} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary font-body">{step.status}</span>
                    <span className="text-xs text-text-tertiary font-body ml-2">{new Date(step.time).toLocaleString()}</span>
                    <p className="text-xs text-text-secondary font-body mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column — Details + Actions */}
        <div className="space-y-6">
          <Card padding="md">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 font-body">{t('specialOrders.detail.customerInfo')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-text-tertiary" />
                <span className="font-bold text-text-primary">{order.customer?.fullName || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-text-tertiary" />
                <span className="font-bold text-text-primary">{order.customer?.phone || '—'}</span>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 font-body">{t('specialOrders.detail.assignment')}</h3>
            <div className="space-y-3 text-sm">
              {order.assignedSupplier ? (
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-text-tertiary" />
                  <div>
                    <p className="text-xs text-text-tertiary font-body">{t('specialOrders.detail.supplier')}</p>
                    <p className="font-bold text-text-primary">{order.assignedSupplier.businessName}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-text-tertiary" />
                  <span className="text-text-tertiary">{t('specialOrders.detail.noSupplier')}</span>
                </div>
              )}
            </div>
          </Card>

          <Card padding="md">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 font-body">{t('specialOrders.detail.internalNotes')}</h3>
            <p className="text-sm text-text-primary font-body whitespace-pre-wrap">{order.internalNotes || t('specialOrders.detail.noInternalNotes')}</p>
            <Button variant="outline" size="sm" className="mt-3" leftIcon={<Pencil size={12} />} onClick={openNotesModal}>
              {t('specialOrders.detail.editNotes')}
            </Button>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between text-xs text-text-tertiary font-body">
              <span>{t('specialOrders.detail.created')}</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-text-tertiary font-body mt-2">
              <span>{t('specialOrders.detail.updated')}</span>
              <span>{new Date(order.updatedAt).toLocaleString()}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Approve Modal */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)} title={t('specialOrders.detail.approveTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">{t('specialOrders.detail.approveDescription')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setApproveModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={approveOrder.isPending} onClick={handleApprove}>{t('specialOrders.detail.confirmApprove')}</Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, reason: '' })} title={t('specialOrders.detail.rejectTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.rejectReason')}</label>
            <textarea rows={3} value={rejectModal.reason} onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none" placeholder={t('specialOrders.detail.rejectPlaceholder')} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setRejectModal({ open: false, reason: '' })}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={rejectOrder.isPending} disabled={!rejectModal.reason.trim()} onClick={handleReject}>{t('specialOrders.detail.confirmReject')}</Button>
          </div>
        </div>
      </Modal>

      {/* Notes Modal */}
      <Modal open={notesModal} onClose={() => setNotesModal(false)} title={t('specialOrders.detail.editNotesTitle')}>
        <div className="space-y-4">
          <textarea rows={5} value={notesText} onChange={(e) => setNotesText(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none" placeholder={t('specialOrders.detail.notesPlaceholder')} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setNotesModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={updateNotes.isPending} onClick={handleUpdateNotes}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal open={assignStaffModal.open} onClose={() => setAssignStaffModal({ open: false, userId: '' })} title={t('specialOrders.detail.assignStaffTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.staffUserId')}</label>
            <input type="number" value={assignStaffModal.userId} onChange={(e) => setAssignStaffModal({ ...assignStaffModal, userId: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setAssignStaffModal({ open: false, userId: '' })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={assignStaff.isPending} disabled={!assignStaffModal.userId} onClick={handleAssignStaff}>{t('specialOrders.detail.assign')}</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Supplier Modal */}
      <Modal open={assignSupplierModal.open} onClose={() => setAssignSupplierModal({ open: false, supplierId: '' })} title={t('specialOrders.detail.assignSupplierTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.supplierId')}</label>
            <input type="number" value={assignSupplierModal.supplierId} onChange={(e) => setAssignSupplierModal({ ...assignSupplierModal, supplierId: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setAssignSupplierModal({ open: false, supplierId: '' })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={assignSupplier.isPending} disabled={!assignSupplierModal.supplierId} onClick={handleAssignSupplier}>{t('specialOrders.detail.assign')}</Button>
          </div>
        </div>
      </Modal>

      {/* Price Quote Modal */}
      <Modal open={priceQuoteModal} onClose={() => setPriceQuoteModal(false)} title={t('specialOrders.detail.priceQuoteTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.priceAmount')}</label>
            <div className="relative">
              <input
                type="number"
                value={priceAmount}
                onChange={(e) => setPriceAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary pr-16"
                placeholder="0.00"
                min="0"
                step="0.01"
              />

            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('specialOrders.detail.priceQuoteNotes')}</label>
            <textarea
              rows={3}
              value={priceNotes}
              onChange={(e) => setPriceNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none"
              placeholder={t('specialOrders.detail.priceQuoteNotesPlaceholder')}
            />
          </div>
          {order.priceQuotes.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <RefreshCw size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-body">{t('specialOrders.detail.priceQuoteUpdateWarning')}</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setPriceQuoteModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={submitPriceQuote.isPending} disabled={!priceAmount || parseFloat(priceAmount) <= 0} onClick={() => {
              submitPriceQuote.mutate({
                id: order.id,
                price: parseFloat(priceAmount),
                notes: priceNotes,
              });
              setPriceQuoteModal(false);
            }}>
              {t('specialOrders.detail.submitQuote')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
