import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { useCustomersPage, useUpdateCustomerStatus } from '../hooks/useCustomers';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Search, Filter, Users, UserCheck, UserX, Star, ShoppingCart, AlertTriangle, Ban, ShieldAlert } from 'lucide-react';
import type { CustomerStatus } from '../api/customersApi';

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

export function CustomersPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useCustomersPage();
  const updateStatus = useUpdateCustomerStatus();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    customerId: number;
    customerName: string;
    newStatus: CustomerStatus;
  }>({ open: false, customerId: 0, customerName: '', newStatus: 'active' });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('customers.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('customers.description')}</p>
        </div>
        <ErrorState
          title={t('common.error')}
          message={error instanceof Error ? error.message : t('common.error')}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const stats = data?.stats;
  const customers = (data?.customers ?? []).filter((c) => {
    const matchesSearch =
      !search ||
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (customerId: number, customerName: string, newStatus: CustomerStatus) => {
    setConfirmModal({ open: true, customerId, customerName, newStatus });
  };

  const confirmStatusChange = () => {
    updateStatus.mutate({ id: confirmModal.customerId, status: confirmModal.newStatus });
    setConfirmModal({ ...confirmModal, open: false });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Users size={22} className="text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('customers.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('customers.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
        {[
          { key: 'total', label: t('customers.stats.total'), icon: Users, variant: 'teal' as const },
          { key: 'active', label: t('customers.stats.active'), icon: UserCheck, variant: 'success' as const },
          { key: 'suspended', label: t('customers.stats.suspended'), icon: Ban, variant: 'coral' as const },
          { key: 'blocked', label: t('customers.stats.blocked'), icon: ShieldAlert, variant: 'purple' as const },
          { key: 'avgRating', label: t('customers.stats.avgRating'), icon: Star, variant: 'warning' as const, suffix: '/5' },
          { key: 'totalOrders', label: t('customers.stats.totalOrders'), icon: ShoppingCart, variant: 'teal' as const },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? (
                      <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      <>{stats?.[s.key as keyof typeof stats] ?? '—'}{s.suffix || ''}</>
                    )}
                  </p>
                </div>
                <div
                  className={cn(
                    'p-2.5 rounded-lg flex-shrink-0',
                    s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                    s.variant === 'success' ? 'bg-green-50 text-green-600' :
                    s.variant === 'warning' ? 'bg-amber-50 text-amber-600' :
                    s.variant === 'purple' ? 'bg-purple-50 text-purple-600' :
                    'bg-brand-accent-light text-brand-accent'
                  )}
                >
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Customers List */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('customers.list.allCustomers')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('customers.list.registered', { count: customers.length })}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('customers.list.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | '')}
              className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all appearance-none"
            >
              <option value="">{t('customers.list.allStatuses')}</option>
              <option value="active">{t('customers.list.active')}</option>
              <option value="inactive">{t('customers.list.inactive')}</option>
              <option value="suspended">{t('customers.list.suspended')}</option>
              <option value="blocked">{t('customers.list.blocked')}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            title={t('customers.list.noCustomers')}
            description={search ? t('customers.list.tryDifferentSearch') : t('customers.list.noFilterMatch')}
          />
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => navigate(ROUTES.CUSTOMER_DETAIL(customer.id))}
                className="p-4 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-brand-primary-light flex items-center justify-center flex-shrink-0">
                        <Users size={16} className="text-brand-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-text-primary font-body">{customer.fullName}</span>
                          <Badge variant={STATUS_BADGE[customer.status]} size="sm">
                            {STATUS_LABELS[customer.status]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="ml-11 mt-2">
                      <div className="flex items-center gap-4 text-xs text-text-secondary font-body flex-wrap">
                        <span>{customer.email} · {customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-text-tertiary font-body flex-wrap">
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-status-star" />
                          {customer.ratingAvg.toFixed(1)}
                        </span>
                        <span>{t('customers.list.orders', { count: customer.ordersCount })}</span>
                        <span>
                          {customer.defaultZone?.nameAr || t('customers.list.noZone')}
                        </span>
                      </div>
                      {customer.addresses.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {customer.addresses.slice(0, 2).map((addr) => (
                            <Badge key={addr.id} variant="teal" size="sm">
                              {addr.label}: {addr.addressDetails}
                            </Badge>
                          ))}
                          {customer.addresses.length > 2 && (
                            <span className="text-xs text-text-tertiary">
                              +{customer.addresses.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {customer.status === 'active' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(customer.id, customer.fullName, 'suspended');
                        }}
                      >
                        {t('customers.list.suspend')}
                      </Button>
                    )}
                    {customer.status === 'suspended' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(customer.id, customer.fullName, 'active');
                        }}
                      >
                        {t('customers.list.activate')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(ROUTES.CUSTOMER_DETAIL(customer.id));
                      }}
                    >
                      {t('customers.list.view')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Confirm Status Change Modal */}
      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        title={
          confirmModal.newStatus === 'suspended'
            ? t('customers.list.suspendTitle', { name: confirmModal.customerName })
            : t('customers.list.activateTitle', { name: confirmModal.customerName })
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary font-body">
              {confirmModal.newStatus === 'suspended'
                ? t('customers.list.suspendDescription')
                : t('customers.list.activateDescription')}
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
              variant={confirmModal.newStatus === 'suspended' ? 'danger' : 'primary'}
              size="sm"
              isLoading={updateStatus.isPending}
              onClick={confirmStatusChange}
            >
              {confirmModal.newStatus === 'suspended' ? t('customers.list.confirmSuspend') : t('customers.list.confirmActivate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
