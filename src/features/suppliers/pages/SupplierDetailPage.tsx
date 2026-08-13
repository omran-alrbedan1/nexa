import { useNavigate, useParams } from 'react-router-dom';
import { useApproveSupplier, useSuspendSupplier, useSupplierProducts, useSupplierCategories, useSyncSupplierCategories, useToggleSupplier, useDeleteSupplier } from '../hooks/useSuppliers';
import { suppliersApi } from '../api/suppliersApi';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { DocumentsSection } from '@/components/documents/DocumentsSection';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowLeft, Building2, Star, ShoppingCart, TrendingUp, CheckCircle2,
  Percent, Phone, Mail, MapPin, FileText, Package, AlertTriangle, Layers, Pencil,
  RotateCcw, Trash2,
} from 'lucide-react';
import { supplierKeys } from '../hooks/useSuppliers';
import type { Supplier } from '../api/suppliersApi';

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'purple'> = {
  active: 'green', inactive: 'yellow', suspended: 'red', pending_approval: 'purple',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// ── Recent Orders Section ──

function RecentOrdersSection({ supplierId, t, totalOrders }: { supplierId: number; t: (key: string, opts?: any) => string; totalOrders: number }) {
  const navigate = useNavigate();
  const formatPrice = useFormatPrice();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['supplier-orders', supplierId],
    queryFn: () => suppliersApi.getSupplierOrders(supplierId),
    enabled: supplierId > 0,
  });

  return (
    <Card padding="lg">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart size={16} className="text-brand-primary" />
        <h3 className="text-sm font-bold text-text-primary font-display">{t('suppliers.detail.recentOrders')}</h3>
        <span className="text-xs text-text-tertiary">{t('suppliers.detail.totalCount', { count: totalOrders })}</span>
      </div>
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
        </div>
      ) : !orders || orders.length === 0 ? (
        <p className="text-sm text-text-secondary font-body">{t('suppliers.detail.recentOrdersPlaceholder')}</p>
      ) : (
        <div className="space-y-2">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="flex items-center justify-between py-3 px-4 rounded-xl border border-border-default/60 hover:bg-bg-section-alt/50 transition-colors cursor-pointer"
              onClick={() => navigate(ROUTES.ORDER_DETAIL(order.id))}
            >
              <div>
                <p className="text-sm font-bold text-text-primary font-body">{order.orderNumber}</p>
                <p className="text-xs text-text-tertiary font-body">{order.customerName} · {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold text-text-primary">{formatPrice(order.total)}</span>
                <span className="text-xs text-text-secondary">{order.itemsCount ?? 0} items</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Supplier Products Section ──

function SupplierProductsSection({ supplierId, t }: { supplierId: number; t: (key: string, opts?: any) => string }) {
  const navigate = useNavigate();
  const formatPrice = useFormatPrice();
  const { data: products, isLoading, isError, refetch } = useSupplierProducts(supplierId);

  if (isLoading) {
    return (
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('suppliers.detail.products')}</h3>
        </div>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('suppliers.detail.products')}</h3>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-status-error font-body">{t('common.error')}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>{t('common.retry')}</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('suppliers.detail.products')}</h3>
          {products && products.length > 0 && (
            <span className="text-xs text-text-tertiary font-body">({products.length})</span>
          )}
        </div>
      </div>

      {!products || products.length === 0 ? (
        <p className="text-sm text-text-secondary font-body">{t('suppliers.detail.productsPlaceholder')}</p>
      ) : (
        <>
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-2.5 pr-3 text-xs font-bold text-text-secondary uppercase tracking-wider">{t('products.detail.productDetails')}</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-text-secondary uppercase tracking-wider">{t('products.detail.price')}</th>
                <th className="text-center py-2.5 px-3 text-xs font-bold text-text-secondary uppercase tracking-wider">{t('products.detail.stock')}</th>
                <th className="text-left py-2.5 px-3 text-xs font-bold text-text-secondary uppercase tracking-wider">{t('products.detail.category')}</th>
                <th className="text-center py-2.5 pl-3 text-xs font-bold text-text-secondary uppercase tracking-wider">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-border-default/50 last:border-0 hover:bg-bg-section-alt/50 transition-colors cursor-pointer"
                  onClick={() => navigate(ROUTES.PRODUCT_DETAIL(product.id))}
                >
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 flex-shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full rounded-lg object-cover border border-border-default/60" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : null}
                        <div className="w-9 h-9 rounded-lg bg-brand-primary-light flex items-center justify-center">
                          <Package size={15} className="text-brand-primary" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary font-body truncate">{product.name}</p>
                        <p className="text-xs text-text-tertiary font-body">{product.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-sm font-extrabold text-text-primary font-display">{formatPrice(product.price)}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={cn(
                      'text-sm font-bold',
                      product.stockQuantity === 0 ? 'text-status-error' :
                      product.stockQuantity < 20 ? 'text-status-warning' :
                      'text-text-primary'
                    )}>
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-left">
                    <span className="text-sm text-text-secondary">{product.categoryName}</span>
                  </td>
                  <td className="py-3 pl-3 text-center">
                    <Badge variant={product.isAvailable ? 'green' : 'red'} size="sm">
                      {product.isAvailable ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile card view */}
        <div className="block sm:hidden space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="p-4 rounded-xl bg-bg-section-alt border border-border-default/60 space-y-2 cursor-pointer"
              onClick={() => navigate(ROUTES.PRODUCT_DETAIL(product.id))}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex-shrink-0">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full rounded-lg object-cover border border-border-default/60" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : null}
                  <div className="w-9 h-9 rounded-lg bg-brand-primary-light flex items-center justify-center">
                    <Package size={15} className="text-brand-primary" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-text-primary font-body truncate">{product.name}</p>
                  <p className="text-xs text-text-tertiary font-body">{product.unit}</p>
                </div>
                <Badge variant={product.isAvailable ? 'green' : 'red'} size="sm">
                  {product.isAvailable ? t('common.active') : t('common.inactive')}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-border-default/50">
                <div>
                  <span className="text-text-tertiary">{t('products.detail.price')} </span>
<span className="font-bold text-text-primary">{formatPrice(product.price)}</span>
                </div>
                <div>
                  <span className="text-text-tertiary">{t('products.detail.stock')} </span>
                  <span className={cn(
                    'font-bold',
                    product.stockQuantity === 0 ? 'text-status-error' :
                    product.stockQuantity < 20 ? 'text-status-warning' :
                    'text-text-primary'
                  )}>{product.stockQuantity}</span>
                </div>
                <div>
                  <span className="text-text-tertiary">{t('products.detail.category')} </span>
                  <span className="text-text-primary">{product.categoryName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </Card>
  );
}

export function SupplierDetailPage() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const id = parseInt(supplierId || '0', 10);
  const { t } = useTranslation();

  const { data: supplier, isLoading, isError, error, refetch } = useQuery<Supplier>({
    queryKey: supplierKeys.detail(id),
    queryFn: () => suppliersApi.getSupplier(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });

  const approveSupplier = useApproveSupplier();
  const suspendSupplier = useSuspendSupplier();
  const toggleSupplier = useToggleSupplier();
  const deleteSupplier = useDeleteSupplier();
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [suspendingId, setSuspendingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; reason: string }>({ open: false, reason: '' });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; typedName: string }>({ open: false, typedName: '' });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: selectedCategoryIds } = useSupplierCategories(id);
  const syncCategories = useSyncSupplierCategories(id);
  const [catModal, setCatModal] = useState(false);
  const [catSelection, setCatSelection] = useState<number[]>([]);
  const { data: allCategories } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => suppliersApi.getAllCategories(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (selectedCategoryIds) {
      setCatSelection(selectedCategoryIds);
    }
  }, [selectedCategoryIds]);

  const STAT_CONFIG = [
    { key: 'totalOrders', label: t('suppliers.detail.totalOrders'), icon: ShoppingCart, variant: 'teal' as const },
    { key: 'totalRevenue', label: t('suppliers.detail.revenue'), icon: TrendingUp, variant: 'success' as const, suffix: '' },
    { key: 'rating', label: t('suppliers.detail.rating'), icon: Star, variant: 'warning' as const, suffix: '/5', format: 'toFixed1' as const },
    { key: 'acceptanceRate', label: t('suppliers.detail.acceptanceRate'), icon: Percent, variant: 'teal' as const, suffix: '%' },
  ];

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.SUPPLIERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('suppliers.detail.back')}
        </button>
        <ErrorState
          title={t('suppliers.detail.errorTitle')}
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
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
      return val.toLocaleString();
    }
    return val ?? '—';
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back */}
      <button onClick={() => navigate(ROUTES.SUPPLIERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('suppliers.detail.back')}
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
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display truncate">{supplier.name}</h1>
                <span className="text-sm text-text-tertiary truncate hidden sm:inline">{supplier.nameAr}</span>
                <Badge variant={STATUS_BADGE[supplier.status]} size="sm">{t('suppliers.status.' + (supplier.status ?? 'unknown'))}</Badge>
              </div>
              <p className="text-sm text-text-secondary font-body mt-1 truncate">
                {supplier.email} · {supplier.phone}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {supplier.status === 'pending_approval' && (
                <>
                  <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} isLoading={approvingId === supplier.id} onClick={() => { setApprovingId(supplier.id); approveSupplier.mutate(supplier.id, { onSettled: () => setApprovingId(null) }); }}>
                    {t('suppliers.list.approve')}
                  </Button>
                  <Button variant="danger" size="sm" leftIcon={<AlertTriangle size={14} />} onClick={() => setSuspendModal({ open: true, reason: '' })}>
                    {t('suppliers.list.reject')}
                  </Button>
                </>
              )}
              {supplier.status === 'active' && (
                <Button variant="danger" size="sm" leftIcon={<AlertTriangle size={14} />} onClick={() => setSuspendModal({ open: true, reason: '' })}>
                  {t('suppliers.list.suspend')}
                </Button>
              )}
              {supplier.status === 'suspended' && (
                <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} />} isLoading={togglingId === supplier.id} onClick={() => {
                  setTogglingId(supplier.id);
                  (supplier.approvalStatus === 'rejected' ? approveSupplier : toggleSupplier).mutate(supplier.id, { onSettled: () => setTogglingId(null) });
                }}>
                  {t('suppliers.list.reactivate')}
                </Button>
              )}
              <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => {
                setDeleteError(null);
                setDeleteModal({ open: true, typedName: '' });
              }}>
                {t('suppliers.delete.button')}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
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
            <h3 className="text-sm font-bold text-text-primary font-display">{t('suppliers.detail.contactInfo')}</h3>
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
              <span className="text-text-primary">{supplier.address || t('suppliers.detail.noAddress')}</span>
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
              <p className="text-xs font-bold text-brand-accent uppercase tracking-wider font-body mb-1">{t('suppliers.detail.notes')}</p>
              <p className="text-sm text-text-primary font-body">{supplier.notes}</p>
            </div>
          )}
        </Card>

        {/* Business Info */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-brand-primary" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('suppliers.detail.businessInfo')}</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary">{t('suppliers.detail.commercialRegister')}</span>
              <span className="font-bold text-text-primary">{supplier.commercialRegister || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary">{t('suppliers.detail.taxNumber')}</span>
              <span className="font-bold text-text-primary">{supplier.taxNumber || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm font-body">
              <span className="text-text-secondary">{t('suppliers.detail.rating')}</span>
              <span className="font-bold text-amber-600 flex items-center gap-1">
                <Star size={14} fill="currentColor" />{supplier.rating.toFixed(1)} / 5
              </span>
            </div>
          </div>
          {/* Categories & Regions */}
          <div className="mt-5">
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('suppliers.detail.categories')}</p>
                <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={() => setCatModal(true)}>
                  {t('common.manage', 'Manage')}
                </Button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {supplier.categories.length > 0
                  ? supplier.categories.map((c) => <Badge key={c} variant="teal" size="sm">{c}</Badge>)
                  : <span className="text-xs text-text-tertiary">{t('suppliers.detail.noCategories', 'No categories')}</span>
                }
              </div>
            </div>
            {supplier.regions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-2">{t('suppliers.detail.deliveryRegions')}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {supplier.regions.map((r) => <Badge key={r} variant="purple" size="sm">{r}</Badge>)}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      {/* Documents */}
      <DocumentsSection
        documents={supplier.documents}
        titleKey="suppliers.detail.documents"
        subtitleKey="suppliers.detail.documentsSubtitle"
        emptyKey="suppliers.detail.noDocuments"
      />

      {/* Products from supplier */}
      <SupplierProductsSection supplierId={id} t={t} />

      {/* Recent Orders */}
      <RecentOrdersSection supplierId={id} t={t} totalOrders={supplier.totalOrders} />

      {/* Category Modal */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title={t('suppliers.detail.manageCategories', 'Manage Categories')}>
        <div className="space-y-3">
          {allCategories?.length === 0 && (
            <p className="text-sm text-text-secondary">{t('suppliers.detail.noCategoriesAvailable', 'No categories available')}</p>
          )}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {allCategories?.map((cat) => (
              <label key={cat.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={catSelection.includes(cat.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCatSelection([...catSelection, cat.id]);
                    } else {
                      setCatSelection(catSelection.filter((id) => id !== cat.id));
                    }
                  }}
                  className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/30"
                />
                <span className="text-sm font-body text-text-primary">{cat.name}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setCatModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={syncCategories.isPending} onClick={() => {
              syncCategories.mutate(catSelection, { onSuccess: () => setCatModal(false) });
            }}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal open={suspendModal.open} onClose={() => setSuspendModal({ ...suspendModal, open: false })} title={t('suppliers.list.suspendTitle', { name: supplier.name })}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">{t('suppliers.list.suspendDescription')}</p>
          <textarea
            rows={3}
            value={suspendModal.reason}
            onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light resize-none bg-bg-input"
            placeholder={t('suppliers.list.suspendReason')}
          />
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setSuspendModal({ ...suspendModal, open: false })}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" disabled={!suspendModal.reason.trim()} isLoading={suspendingId === supplier.id} onClick={() => {
              setSuspendingId(supplier.id);
              suspendSupplier.mutate({ id: supplier.id, reason: suspendModal.reason }, { onSettled: () => setSuspendingId(null) });
              setSuspendModal({ ...suspendModal, open: false });
            }}>{t('suppliers.list.confirmSuspend')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ ...deleteModal, open: false })} title={t('suppliers.delete.title', { name: supplier.name })}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">{t('suppliers.delete.confirm')}</p>
          <p className="text-sm text-red-600 font-body">{t('suppliers.delete.warning')}</p>
          <input
            value={deleteModal.typedName}
            onChange={(e) => setDeleteModal({ ...deleteModal, typedName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input"
            placeholder={t('suppliers.delete.typeName', { name: supplier.name })}
          />
          {deleteError && (
            <p className="text-xs text-red-600 font-body bg-red-50 border border-red-100 rounded-lg px-3 py-2">{deleteError}</p>
          )}
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteModal({ ...deleteModal, open: false })}>{t('common.cancel')}</Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleteModal.typedName !== supplier.name}
              isLoading={deleteSupplier.isPending}
              onClick={() => {
                setDeleteError(null);
                deleteSupplier.mutate(supplier.id, {
                  onSuccess: () => navigate(ROUTES.SUPPLIERS),
                  onError: (err: unknown) => {
                    let errorMsg: string | null = null;
                    if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
                      const data = err.response.data as { message?: unknown; error_code?: unknown };
                      if (data.error_code === 'supplier_has_open_orders') {
                        errorMsg = 'suppliers.delete.openOrdersError';
                      } else if (typeof data.message === 'string' && data.message.trim()) {
                        errorMsg = data.message;
                      }
                    }
                    setDeleteError(errorMsg === 'suppliers.delete.openOrdersError' ? t('suppliers.delete.openOrdersError') : (errorMsg ?? t('suppliers.delete.failed')));
                  },
                });
              }}
            >{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
