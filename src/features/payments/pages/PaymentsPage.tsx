import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { paymentsApi } from '../api/paymentsApi';
import { usePaymentsPage, paymentKeys } from '../hooks/usePayments';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListItem } from '@/components/ui/ListItem';
import { Pagination } from '@/components/ui/Pagination';
import { DollarSign, Search, Filter, CreditCard, Ban } from 'lucide-react';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import type { Payment } from '../api/paymentsApi';

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'purple'> = {
  paid: 'green', pending: 'yellow', failed: 'red', refunded: 'purple', partial_refunded: 'purple',
};



export function PaymentsPage() {
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [refundModal, setRefundModal] = useState<{ open: boolean; paymentId: number; amount: string; reason: string }>({
    open: false, paymentId: 0, amount: '', reason: '',
  });

  const { data, isLoading, isError, error, refetch } = usePaymentsPage({
    page,
    status: statusFilter || undefined,
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: number; amount: number; reason: string }) =>
      paymentsApi.refund(id, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.pageData() });
      addToast('success', 'Refund processed');
      setRefundModal({ open: false, paymentId: 0, amount: '', reason: '' });
    },
    onError: () => addToast('error', 'Failed to process refund'),
  });

  // Transaction/order search is client-side only (backend has no free-text search for payments) — applies to the current page only.
  const payments: Payment[] = (data?.payments || []).filter((p) =>
    !search || p.transactionId?.toLowerCase().includes(search.toLowerCase()) || p.order?.orderNumber?.includes(search)
  );
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };

  const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-green-500/10 via-green-50 to-transparent">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <DollarSign size={22} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('payments.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('payments.description')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-primary-light text-brand-primary"><DollarSign size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('payments.totalPayments')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{payments.length}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600"><DollarSign size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('payments.totalAmount')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{formatPrice(totalAmount)}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600"><CreditCard size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('payments.refunded')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{payments.filter((p) => p.status === 'refunded').length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('payments.allPayments')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{meta.total} {t('common.items')}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="w-full sm:flex-1 sm:max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('payments.searchPlaceholder')} className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none appearance-none focus:border-brand-primary">
              <option value="">{t('payments.allStatuses')}</option>
              <option value="paid">{t('payments.statusPaid')}</option>
              <option value="pending">{t('payments.statusPending')}</option>
              <option value="failed">{t('payments.statusFailed')}</option>
              <option value="refunded">{t('payments.refunded')}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
        ) : payments.length === 0 ? (
          <EmptyState title={t('payments.noPayments')} description={t('payments.noPaymentsDescription')} />
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <ListItem
                key={payment.id}
                icon={<DollarSign size={16} className="text-green-600" />}
                iconClassName="bg-green-50"
                title={<span className="text-sm font-bold text-text-primary font-body truncate">{formatPrice(payment.amount ?? 0)}</span>}
                badges={<Badge variant={STATUS_BADGE[payment.status] || 'yellow'} size="sm">{payment.status}</Badge>}
                actions={payment.status === 'paid' && (
                  <Button variant="secondary" size="sm" leftIcon={<Ban size={12} />} onClick={() => setRefundModal({ open: true, paymentId: payment.id, amount: '', reason: '' })}>
                    {t('payments.refund')}
                  </Button>
                )}
              >
                <div className="flex items-center gap-3 text-xs text-text-tertiary font-body flex-wrap">
                  <span>{payment.transactionId}</span>
                  {payment.order && <span>Order #{payment.order.orderNumber}</span>}
                  {payment.paymentMethod && <span>{payment.paymentMethod.nameAr}</span>}
                  <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                </div>
              </ListItem>
            ))}
          </div>
        )}
        <Pagination
          currentPage={meta.currentPage}
          lastPage={meta.lastPage}
          total={meta.total}
          perPage={15}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </Card>

      {/* Refund Modal */}
      <Modal open={refundModal.open} onClose={() => setRefundModal({ ...refundModal, open: false })} title={t('payments.refundTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('payments.refundAmount')}</label>
            <input type="number" value={refundModal.amount} onChange={(e) => setRefundModal({ ...refundModal, amount: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('payments.refundReason')}</label>
            <textarea rows={3} value={refundModal.reason} onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary resize-none" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setRefundModal({ ...refundModal, open: false })}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" isLoading={refundMutation.isPending} onClick={() => refundMutation.mutate({ id: refundModal.paymentId, amount: parseFloat(refundModal.amount) || 0, reason: refundModal.reason })}>
              {t('payments.confirmRefund')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
