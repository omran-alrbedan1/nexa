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
import { ListItem } from '@/components/ui/ListItem';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Filter, Users, UserCheck, UserX, Star, ShoppingCart, AlertTriangle, Ban, ShieldAlert, Plus } from 'lucide-react';
import type { CustomerStatus } from '../api/customersApi';
import { useCreateCustomer } from '../hooks/useCustomers';

const STATUS_BADGE: Record<CustomerStatus, 'green' | 'yellow' | 'red' | 'purple'> = {
  active: 'green',
  inactive: 'yellow',
  suspended: 'red',
  blocked: 'purple',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function CustomersPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const STATUS_LABELS: Record<CustomerStatus, string> = {
    active: t('customers.status.active'),
    inactive: t('customers.status.inactive'),
    suspended: t('customers.status.suspended'),
    blocked: t('customers.status.blocked'),
  };
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useCustomersPage({
    page,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  });
  const updateStatus = useUpdateCustomerStatus();
  const createCustomer = useCreateCustomer();
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
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
  const customers = data?.customers ?? [];
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };

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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
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
        <CardHeader
          action={
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreateModal(true)}>
              {t('customers.list.addCustomer')}
            </Button>
          }
        >
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('customers.list.allCustomers')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('customers.list.registered', { count: meta.total })}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="w-full sm:flex-1 sm:max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('customers.list.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CustomerStatus | '');
                setPage(1);
              }}
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
              <ListItem
                key={customer.id}
                onClick={() => navigate(ROUTES.CUSTOMER_DETAIL(customer.id))}
                icon={<Users size={16} className="text-brand-primary" />}
                title={<span className="text-sm font-bold text-text-primary font-body truncate">{customer.fullName}</span>}
                badges={<Badge variant={STATUS_BADGE[customer.status]} size="sm">{STATUS_LABELS[customer.status]}</Badge>}
                actions={<>
                  {customer.status === 'active' && (
                    <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(customer.id, customer.fullName, 'suspended'); }}>
                      {t('customers.list.suspend')}
                    </Button>
                  )}
                  {customer.status === 'suspended' && (
                    <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(customer.id, customer.fullName, 'active'); }}>
                      {t('customers.list.activate')}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(ROUTES.CUSTOMER_DETAIL(customer.id)); }}>
                    {t('customers.list.view')}
                  </Button>
                </>}
              >
                <div className="flex items-center gap-4 text-xs text-text-secondary font-body flex-wrap">
                  <span className="truncate">{customer.email} · {customer.phone}</span>
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

      {/* Create Customer Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title={t('customers.create.title')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('customers.create.firstName')}</label>
              <input value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('customers.create.lastName')}</label>
              <input value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('customers.create.phone')}</label>
            <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('customers.create.email')}</label>
            <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('customers.create.password')}</label>
            <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setCreateModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={createCustomer.isPending} onClick={() => {
              createCustomer.mutate(createForm, {
                onSuccess: () => {
                  setCreateModal(false);
                  setCreateForm({ firstName: '', lastName: '', phone: '', email: '', password: '' });
                },
              });
            }}>{t('customers.create.submit')}</Button>
          </div>
        </div>
      </Modal>

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
