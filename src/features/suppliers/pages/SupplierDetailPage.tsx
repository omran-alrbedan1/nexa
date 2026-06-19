import { useNavigate, useParams } from 'react-router-dom';
import { useSuppliersPage, useApproveSupplier, useSuspendSupplier } from '../hooks/useSuppliers';
import { suppliersApi } from '../api/suppliersApi';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { useState } from 'react';
import {
  ArrowLeft, Building2, Star, ShoppingCart, TrendingUp, CheckCircle2,
  Percent, Phone, Mail, MapPin, CreditCard, FileText, Package, AlertTriangle,
} from 'lucide-react';
import { supplierKeys } from '../hooks/useSuppliers';
import type { Supplier } from '../api/suppliersApi';

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'purple'> = {
  active: 'green', inactive: 'yellow', suspended: 'red', pending_approval: 'purple',
};

const STAT_CONFIG = [
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingCart, variant: 'teal' as const },
  { key: 'totalRevenue', label: 'Revenue', icon: TrendingUp, variant: 'success' as const, suffix: '' },
  { key: 'rating', label: 'Rating', icon: Star, variant: 'warning' as const, suffix: '/5', format: 'toFixed1' as const },
  { key: 'acceptanceRate', label: 'Acceptance Rate', icon: Percent, variant: 'teal' as const, suffix: '%' },
  { key: 'commissionRate', label: 'Commission', icon: Percent, variant: 'coral' as const, suffix: '%' },
];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function SupplierDetailPage() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const id = parseInt(supplierId || '0', 10);

  const { data: supplier, isLoading, isError, error, refetch } = useQuery<Supplier>({
    queryKey: supplierKeys.detail(id),
    queryFn: () => suppliersApi.getSupplier(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });

  const approveSupplier = useApproveSupplier();
  const suspendSupplier = useSuspendSupplier();
  const addToast = useToastStore((s) => s.addToast);
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; reason: string }>({ open: false, reason: '' });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.SUPPLIERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> Back to Suppliers
        </button>
        <ErrorState
          title="Failed to load supplier"
          message={error instanceof Error ? error.message : 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading || !supplier) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const formatValue = (stat: typeof STAT_CONFIG[0]) => {
    const val = supplier[stat.key as keyof Supplier];
    if (typeof val === 'number') {
      if (stat.format === 'toFixed1') return val.toFixed(1);
      if (stat.suffix === '%') return `${val}%`;
      return val.toLocaleString();
    }
    return val ?? '—';
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back */}
      <button onClick={() => navigate(ROUTES.SUPPLIERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Suppliers
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Building2 size={28} className="text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{supplier.name}</h1>
                <span className="text-sm text-text-tertiary">{supplier.nameAr}</span>
                <Badge variant={STATUS_BADGE[supplier.status]} size="sm">{supplier.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-sm text-text-secondary font-body mt-1">
                {supplier.email} · {supplier.phone}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {supplier.status === 'pending_approval' && (
                <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} isLoading={approveSupplier.isPending} onClick={() => approveSupplier.mutate(supplier.id)}>
                  Approve
                </Button>
              )}
              {supplier.status === 'active' && (
                <Button variant="danger" size="sm" leftIcon={<AlertTriangle size={14} />} onClick={() => setSuspendModal({ open: true, reason: '' })}>
                  Suspend
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-5">
        {STAT_CONFIG.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">{formatValue(s)}{s.suffix || ''}</p>
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

      {/* Two-column info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-brand-primary" />
            <h3 className="text-sm font-bold text-text-primary font-display">Contact Information</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-body">
              <Phone size={14} className="text-text-tertiary flex-shrink-0" />
              <span className="text-text-primary">{supplier.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-body">
              <Mail size={14} className="text-text-tertiary flex-shrink-0" />
              <span className="text-text-primary">{supplier.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-body">
              <MapPin size={14} className="text-text-tertiary flex-shrink-0" />
              <span className="text-text-primary">{supplier.address || 'No address on file'}</span>
            </div>
            {supplier.contactPerson && (
              <div className="flex items-center gap-3 text-sm font-body">
                <Building2 size={14} className="text-text-tertiary flex-shrink-0" />
                <div>
                  <span className="text-text-primary">{supplier.contactPerson}</span>
                  <span className="text-text-secondary ml-2">({supplier.contactPhone})</span>
                </div>
              </div>
            )}
          </div>
          {supplier.notes && (
            <div className="mt-5 p-3 rounded-xl bg-brand-accent-light/50 border border-brand-accent/10">
              <p className="text-xs font-bold text-brand-accent uppercase tracking-wider font-body mb-1">Notes</p>
              <p className="text-sm text-text-primary font-body">{supplier.notes}</p>
            </div>
          )}
        </Card>

        {/* Business Info */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-brand-primary" />
            <h3 className="text-sm font-bold text-text-primary font-display">Business Information</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary">Commercial Register</span>
              <span className="font-bold text-text-primary">{supplier.commercialRegister || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary">Tax Number</span>
              <span className="font-bold text-text-primary">{supplier.taxNumber || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary">Payment Terms</span>
              <span className="font-bold text-text-primary capitalize">{supplier.paymentTerms.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary">Commission Rate</span>
              <span className="font-bold text-text-primary">{supplier.commissionRate}%</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm font-body">
              <span className="text-text-secondary">Rating</span>
              <span className="font-bold text-amber-600 flex items-center gap-1">
                <Star size={14} fill="currentColor" />{supplier.rating.toFixed(1)} / 5
              </span>
            </div>
          </div>
          {/* Categories & Regions */}
          <div className="mt-5">
            {supplier.categories.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-2">Categories</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {supplier.categories.map((c) => <Badge key={c} variant="teal" size="sm">{c}</Badge>)}
                </div>
              </div>
            )}
            {supplier.regions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-2">Delivery Regions</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {supplier.regions.map((r) => <Badge key={r} variant="purple" size="sm">{r}</Badge>)}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Products from supplier */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">Supplier Products</h3>
        </div>
        <p className="text-sm text-text-secondary font-body">
          Product catalog for this supplier will appear here once the backend provides product data.
        </p>
      </Card>

      {/* Recent Orders */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">Recent Orders</h3>
          <span className="text-xs text-text-tertiary">({supplier.totalOrders} total)</span>
        </div>
        <p className="text-sm text-text-secondary font-body">
          Order history for this supplier will appear here once the backend provides order data.
        </p>
      </Card>

      {/* Suspend Modal */}
      <Modal open={suspendModal.open} onClose={() => setSuspendModal({ ...suspendModal, open: false })} title={`Suspend ${supplier.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">Enter the reason for suspending this supplier. They will not be able to receive orders while suspended.</p>
          <textarea
            rows={3}
            value={suspendModal.reason}
            onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light resize-none bg-bg-input"
            placeholder="Reason for suspension..."
          />
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setSuspendModal({ ...suspendModal, open: false })}>Cancel</Button>
            <Button variant="danger" size="sm" disabled={!suspendModal.reason.trim()} isLoading={suspendSupplier.isPending} onClick={() => {
              suspendSupplier.mutate({ id: supplier.id, reason: suspendModal.reason });
              setSuspendModal({ ...suspendModal, open: false });
            }}>Confirm Suspend</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
