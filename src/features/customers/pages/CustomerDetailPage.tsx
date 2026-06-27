import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomerDetail, useCustomerOrders, useUpdateCustomerStatus, useUpdateCustomerNotes, customerKeys } from '../hooks/useCustomers';
import { type CustomerStatus } from '../api/customersApi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import {
  ArrowLeft, User, Star, ShoppingCart, Phone, Mail,
  MapPin,  Shield, ShieldAlert, AlertTriangle, CheckCircle2, Ban,
  FileText, Calendar, Home, Hash, ClipboardList,
} from 'lucide-react';

const STATUS_BADGE: Record<CustomerStatus, 'green' | 'yellow' | 'red' | 'purple'> = {
  active: 'green',
  inactive: 'yellow',
  suspended: 'red',
  blocked: 'purple',
};

const STATUS_LABELS: Record<CustomerStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
  blocked: 'Blocked',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const id = parseInt(customerId || '0', 10);
  const { t } = useTranslation();

  const { data: customer, isLoading, isError, error, refetch } = useCustomerDetail(id);
  const { data: ordersData } = useCustomerOrders(id);
  const updateStatus = useUpdateCustomerStatus();
  const updateNotes = useUpdateCustomerNotes();

  const [notesModal, setNotesModal] = useState<{ open: boolean; notes: string }>({
    open: false,
    notes: '',
  });
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    newStatus: CustomerStatus;
  }>({ open: false, newStatus: 'active' });

  const STAT_CONFIG = [
    { key: 'ordersCount', label: t('customers.detail.totalOrders'), icon: ShoppingCart, variant: 'teal' as const },
    { key: 'ratingAvg', label: t('customers.detail.rating'), icon: Star, variant: 'warning' as const, suffix: '/5', format: 'toFixed1' as const },
  ];

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button
          onClick={() => navigate(ROUTES.CUSTOMERS)}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body"
        >
          <ArrowLeft size={16} /> {t('customers.detail.back')}
        </button>
        <ErrorState
          title={t('customers.detail.errorTitle')}
          message={error instanceof Error ? error.message : 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading || !customer) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const formatValue = (stat: typeof STAT_CONFIG[0]) => {
    const val = customer[stat.key as keyof typeof customer] as number;
    if (typeof val === 'number') {
      if (stat.format === 'toFixed1') return val.toFixed(1);
      return val.toLocaleString();
    }
    return val ?? '—';
  };

  const handleStatusChange = (newStatus: CustomerStatus) => {
    setConfirmModal({ open: true, newStatus });
  };

  const confirmStatusChange = () => {
    updateStatus.mutate({ id: customer.id, status: confirmModal.newStatus });
    setConfirmModal({ ...confirmModal, open: false });
  };

  const openNotesModal = () => {
    setNotesModal({ open: true, notes: customer.internalNotes });
  };

  const saveNotes = () => {
    updateNotes.mutate({ id: customer.id, notes: notesModal.notes });
    setNotesModal({ ...notesModal, open: false });
  };

  const orders = ordersData?.data || [];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back */}
      <button
        onClick={() => navigate(ROUTES.CUSTOMERS)}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body"
      >
        <ArrowLeft size={16} /> {t('customers.detail.back')}
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <User size={28} className="text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{customer.fullName}</h1>
                <Badge variant={STATUS_BADGE[customer.status]} size="sm">
                  {STATUS_LABELS[customer.status]}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary font-body mt-1">
                {customer.email} · {customer.phone}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {customer.status === 'active' && (
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Ban size={14} />}
                  onClick={() => handleStatusChange('suspended')}
                >
                  {t('customers.list.suspend')}
                </Button>
              )}
              {customer.status === 'suspended' && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle2 size={14} />}
                  onClick={() => handleStatusChange('active')}
                >
                  {t('customers.list.activate')}
                </Button>
              )}
              {(customer.status === 'active' || customer.status === 'suspended') && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ShieldAlert size={14} />}
                  onClick={() => handleStatusChange('blocked')}
                >
                  {t('customers.list.block')}
                </Button>
              )}
              {customer.status === 'blocked' && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle2 size={14} />}
                  onClick={() => handleStatusChange('active')}
                >
                  {t('customers.list.unblock')}
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        {STAT_CONFIG.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {formatValue(s)}
                    {s.suffix || ''}
                  </p>
                </div>
                <div
                  className={cn(
                    'p-2.5 rounded-lg flex-shrink-0',
                    s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                    s.variant === 'success' ? 'bg-green-50 text-green-600' :
                    s.variant === 'warning' ? 'bg-amber-50 text-amber-600' :
                    'bg-brand-accent-light text-brand-accent'
                  )}
                >
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
        {/* Registered date */}
        <Card padding="md" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('customers.detail.registered')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-brand-primary-light text-brand-primary flex-shrink-0">
              <Calendar size={18} />
            </div>
          </div>
        </Card>
      </div>

      {/* Two-column info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-brand-primary" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('customers.detail.contactInfo')}</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-body">
              <Phone size={14} className="text-text-tertiary flex-shrink-0" />
              <span className="text-text-primary">{customer.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-body">
              <Mail size={14} className="text-text-tertiary flex-shrink-0" />
              <span className="text-text-primary">{customer.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-body">
              <MapPin size={14} className="text-text-tertiary flex-shrink-0" />
              <span className="text-text-primary">
                {customer.defaultZone?.nameAr || t('customers.detail.noDefaultZone')}
              </span>
            </div>
          </div>

          {/* Addresses */}
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <Home size={14} className="text-brand-primary" />
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">
                {t('customers.detail.addresses')} ({customer.addresses.length})
              </h4>
            </div>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-text-tertiary font-body">{t('customers.detail.noAddresses')}</p>
            ) : (
              <div className="space-y-2">
                {customer.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-3 rounded-xl bg-bg-section-alt border border-border-default/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary font-body">{addr.label}</span>
                        {addr.isDefault && (
                          <Badge variant="green" size="sm">{t('customers.detail.default')}</Badge>
                        )}
                      </div>
                      {addr.zone && (
                        <span className="text-xs text-text-tertiary">{addr.zone.nameAr}</span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary font-body mt-1">{addr.addressDetails}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Internal Notes */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-brand-primary" />
              <h3 className="text-sm font-bold text-text-primary font-display">{t('customers.detail.internalNotes')}</h3>
            </div>
            <Button variant="outline" size="sm" onClick={openNotesModal}>
              {customer.internalNotes ? t('customers.detail.editNotes') : t('customers.detail.addNotes')}
            </Button>
          </div>
          {customer.internalNotes ? (
            <p className="text-sm text-text-primary font-body whitespace-pre-wrap">{customer.internalNotes}</p>
          ) : (
            <p className="text-sm text-text-tertiary font-body italic">{t('customers.detail.noNotes')}</p>
          )}

          {/* Account Info */}
          <div className="mt-6 pt-4 border-t border-border-default/50">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-brand-primary" />
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">
                {t('customers.detail.accountInfo')}
              </h4>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary">{t('customers.detail.status')}</span>
              <Badge variant={STATUS_BADGE[customer.status]} size="sm">
                {STATUS_LABELS[customer.status]}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary">{t('customers.detail.totalOrders')}</span>
              <span className="font-bold text-text-primary">{customer.ordersCount}</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm font-body">
              <span className="text-text-secondary">{t('customers.detail.rating')}</span>
              <span className="font-bold text-amber-600 flex items-center gap-1">
                <Star size={14} fill="currentColor" />
                {customer.ratingAvg.toFixed(1)} / 5
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('customers.detail.recentOrders')}</h3>
          <span className="text-xs text-text-tertiary">{t('customers.detail.totalCount', { count: customer.ordersCount })}</span>
        </div>
        {orders.length === 0 ? (
          <EmptyState
            title={t('customers.detail.noOrders')}
            description={t('customers.detail.noOrdersDescription')}
          />
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 10).map((order: any) => (
              <div
                key={order.id}
                onClick={() => navigate(ROUTES.ORDER_DETAIL(order.id))}
                className="p-3 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Hash size={14} className="text-text-tertiary" />
                    <span className="text-sm font-bold text-text-primary font-body">
                      {order.order_number || `#${order.id}`}
                    </span>
                    <Badge variant={order.status === 'delivered' ? 'green' : 'yellow'} size="sm">
                      {order.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-text-secondary font-body">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notes Modal */}
      <Modal
        open={notesModal.open}
        onClose={() => setNotesModal({ ...notesModal, open: false })}
        title={t('customers.detail.editNotes')}
      >
        <div className="space-y-4">
          <textarea
            rows={5}
            value={notesModal.notes}
            onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light resize-none bg-bg-input"
            placeholder={t('customers.detail.notesPlaceholder')}
          />
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setNotesModal({ ...notesModal, open: false })}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={updateNotes.isPending}
              onClick={saveNotes}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Status Change Modal */}
      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        title={
          confirmModal.newStatus === 'suspended'
            ? t('customers.detail.suspendTitle', { name: customer.fullName })
            : confirmModal.newStatus === 'blocked'
            ? t('customers.detail.blockTitle', { name: customer.fullName })
            : t('customers.detail.activateTitle', { name: customer.fullName })
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary font-body">
              {confirmModal.newStatus === 'suspended'
                ? t('customers.detail.suspendDescription')
                : confirmModal.newStatus === 'blocked'
                ? t('customers.detail.blockDescription')
                : t('customers.detail.activateDescription')}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmModal({ ...confirmModal, open: false })}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant={confirmModal.newStatus === 'active' ? 'primary' : 'danger'}
              size="sm"
              isLoading={updateStatus.isPending}
              onClick={confirmStatusChange}
            >
              {confirmModal.newStatus === 'suspended'
                ? t('customers.detail.confirmSuspend')
                : confirmModal.newStatus === 'blocked'
                ? t('customers.detail.confirmBlock')
                : t('customers.detail.confirmActivate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
