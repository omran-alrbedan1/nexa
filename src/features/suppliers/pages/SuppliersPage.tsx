import { useState } from 'react';
import { useSuppliersPage, useApproveSupplier, useSuspendSupplier } from '../hooks/useSuppliers';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToastStore } from '@/stores/toastStore';
import { Building2, Users, CheckCircle2, AlertTriangle, Star, Search, Filter, Plus } from 'lucide-react';
import type { SupplierStatus } from '../api/suppliersApi';

const STATUS_BADGE: Record<SupplierStatus, 'green' | 'yellow' | 'red' | 'purple'> = {
  active: 'green', inactive: 'yellow', suspended: 'red', pending_approval: 'purple',
};

const STAT_CONFIG = [
  { key: 'total', label: 'Total Suppliers', icon: Building2, variant: 'teal' as const },
  { key: 'active', label: 'Active', icon: CheckCircle2, variant: 'success' as const },
  { key: 'pendingApproval', label: 'Pending Approval', icon: Users, variant: 'warning' as const },
  { key: 'suspended', label: 'Suspended', icon: AlertTriangle, variant: 'coral' as const },
  { key: 'avgRating', label: 'Avg Rating', icon: Star, variant: 'warning' as const, suffix: '/5' },
];

export function SuppliersPage() {
  const { data, isLoading, isError, error, refetch } = useSuppliersPage();
  const approveSupplier = useApproveSupplier();
  const suspendSupplier = useSuspendSupplier();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | ''>('');
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; supplierId: number; supplierName: string; reason: string }>({ open: false, supplierId: 0, supplierName: '', reason: '' });

  if (isError) return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary font-display">Suppliers</h1>
        <p className="text-sm text-text-secondary font-body mt-1">Manage supplier profiles, approvals, and contracts</p>
      </div>
      <ErrorState title="Failed to load suppliers" message={error instanceof Error ? error.message : 'An error occurred'} onRetry={() => refetch()} />
    </div>
  );

  const stats = data?.stats;
  const suppliers = (data?.suppliers ?? []).filter((s) => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Building2 size={22} className="text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">Suppliers</h1>
              <p className="text-sm text-text-secondary font-body">Manage supplier profiles, approvals, and contracts</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {STAT_CONFIG.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : (
                      <>{s.key === 'avgRating' ? stats?.[s.key as keyof typeof stats]?.toFixed(1) : stats?.[s.key as keyof typeof stats] ?? '—'}{s.suffix || ''}</>
                    )}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                  s.variant === 'success' ? 'bg-green-50 text-green-600' :
                  s.variant === 'warning' ? 'bg-amber-50 text-amber-600' :
                  'bg-brand-accent-light text-brand-accent'
                )}>
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Suppliers List */}
      <Card padding="lg">
        <CardHeader
          action={
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => useToastStore.getState().addToast('info', 'Create supplier form coming soon')}>
              Add Supplier
            </Button>
          }
        >
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">All Suppliers</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{suppliers.length} registered suppliers</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers..."
              className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SupplierStatus | '')}
              className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_approval">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}</div>
        ) : suppliers.length === 0 ? (
          <EmptyState title="No suppliers found" description={search ? 'Try a different search term' : 'No suppliers match the filter'} />
        ) : (
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="p-4 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-brand-primary-light flex items-center justify-center flex-shrink-0">
                        <Building2 size={16} className="text-brand-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-text-primary font-body">{supplier.name}</span>
                          <span className="text-xs text-text-tertiary">{supplier.nameAr}</span>
                          <Badge variant={STATUS_BADGE[supplier.status]} size="sm">{supplier.status.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="ml-11 mt-2">
                      <div className="flex items-center gap-4 text-xs text-text-secondary font-body flex-wrap">
                        <span>{supplier.email} · {supplier.phone}</span>
                        <span>CR: {supplier.commercialRegister}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-text-tertiary font-body flex-wrap">
                        <span className="flex items-center gap-1"><Star size={12} className="text-status-star" />{supplier.rating.toFixed(1)}</span>
                        <span>{supplier.totalOrders} orders</span>
                        <span className="font-bold text-text-primary">{supplier.totalRevenue.toLocaleString()} SAR</span>
                        <span>Accept: {supplier.acceptanceRate}%</span>
                        <span>{supplier.commissionRate}% commission</span>
                        <span>{supplier.paymentTerms.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {supplier.categories.map((c) => <Badge key={c} variant="teal" size="sm">{c}</Badge>)}
                        {supplier.regions.map((r) => <Badge key={r} variant="purple" size="sm">{r}</Badge>)}
                      </div>
                      {supplier.notes && <p className="text-xs text-brand-accent mt-1.5 italic font-body">{supplier.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {supplier.status === 'pending_approval' && (
                      <Button variant="primary" size="sm" isLoading={approveSupplier.isPending} onClick={() => approveSupplier.mutate(supplier.id)}>Approve</Button>
                    )}
                    {supplier.status === 'active' && (
                      <Button variant="danger" size="sm" onClick={() => setSuspendModal({ open: true, supplierId: supplier.id, supplierName: supplier.name, reason: '' })}>Suspend</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => useToastStore.getState().addToast('info', `${supplier.name} detail page coming soon`)}>View</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Suspend Modal */}
      <Modal open={suspendModal.open} onClose={() => setSuspendModal({ ...suspendModal, open: false })} title={`Suspend ${suspendModal.supplierName}`}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">Enter the reason for suspending this supplier. They will not be able to receive orders while suspended.</p>
          <textarea rows={3} value={suspendModal.reason} onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light resize-none bg-bg-input" placeholder="Reason for suspension..." />
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setSuspendModal({ ...suspendModal, open: false })}>Cancel</Button>
            <Button variant="danger" size="sm" disabled={!suspendModal.reason.trim()} isLoading={suspendSupplier.isPending} onClick={() => { suspendSupplier.mutate({ id: suspendModal.supplierId, reason: suspendModal.reason }); setSuspendModal({ ...suspendModal, open: false }); }}>Confirm Suspend</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
