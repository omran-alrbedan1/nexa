import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useProductsPage, useToggleProductAvailability, useApproveProduct, useRejectProduct } from '../hooks/useProductsAdmin';
import { productsApi } from '../api/productsApi';
import { ROUTES } from '@/routes/routes';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToastStore } from '@/stores/toastStore';
import { ListItem } from '@/components/ui/ListItem';
import { Package, CheckCircle2, AlertTriangle, Layers, Users, TrendingUp, Plus, Search, Filter, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useFormatPrice } from '@/hooks/useFormatPrice';

const SOURCE_BADGE: Record<string, 'teal' | 'purple' | 'yellow'> = { supplier: 'teal', internal: 'purple', seasonal: 'yellow' };



export function ProductsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();
  const { data, isLoading, isError, error, refetch } = useProductsPage();
  const toggleAvailability = useToggleProductAvailability();
  const approveProduct = useApproveProduct();
  const rejectProduct = useRejectProduct();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [showPendingTab, setShowPendingTab] = useState(false);

  // Fetch pending-approval products
  const { data: pendingProducts } = useQuery({
    queryKey: ['products', 'pending-approvals'],
    queryFn: () => productsApi.getPendingApprovals(),
    staleTime: 15_000,
  });

  if (isError) return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('products.title')}</h1>
        <p className="text-sm text-text-secondary font-body mt-1">{t('products.description')}</p>
      </div>
      <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
    </div>
  );

  const stats = data?.stats;
  const categories = data?.categories ?? [];
  const products = (data?.products ?? []).filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.supplierName?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const allCategories = Array.isArray(categories) ? categories.flatMap((c) => [c, ...(c.children || [])]) : [];
  const hasLowStock = products.filter((p) => p.isAvailable && p.stockQuantity < 20).length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Package size={22} className="text-brand-accent" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('products.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('products.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
        {[
          { key: 'totalProducts', label: t('products.stats.totalProducts'), icon: Package, variant: 'teal' as const },
          { key: 'available', label: t('products.stats.available'), icon: CheckCircle2, variant: 'success' as const },
          { key: 'outOfStock', label: t('products.stats.outOfStock'), icon: AlertTriangle, variant: 'coral' as const },
          { key: 'categories', label: t('products.stats.categories'), icon: Layers, variant: 'purple' as const },
          { key: 'suppliers', label: t('products.stats.suppliers'), icon: Users, variant: 'warning' as const },
          { key: 'avgPrice', label: t('products.stats.avgPrice'), icon: TrendingUp, variant: 'teal' as const, suffix: '' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : (
                      <>{s.key === 'avgPrice' ? stats?.[s.key]?.toFixed(2) : stats?.[s.key as keyof typeof stats] ?? '—'}{s.suffix || ''}</>
                    )}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                  s.variant === 'success' ? 'bg-green-50 text-green-600' :
                  s.variant === 'coral' ? 'bg-brand-accent-light text-brand-accent' :
                  s.variant === 'purple' ? 'bg-purple-50 text-purple-600' :
                  'bg-amber-50 text-amber-600'
                )}>
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Pending Approvals Section ── */}
      {pendingProducts && pendingProducts.length > 0 && (
        <Card padding="lg">
          <CardHeader
            action={
              <Button variant="primary" size="sm" onClick={() => setShowPendingTab(!showPendingTab)}>
                {showPendingTab ? t('products.pendingApproval.hide') : t('products.pendingApproval.review', { count: pendingProducts.length })}
              </Button>
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display">{t('products.pendingApproval.title')}</h3>
                <p className="text-xs text-text-secondary font-body">{t('products.pendingApproval.count', { count: pendingProducts.length })}</p>
              </div>
            </div>
          </CardHeader>
          {showPendingTab && (
            <div className="space-y-2">
              {pendingProducts.map((product) => (
                <div key={product.id} className="rounded-xl border border-amber-100 bg-amber-50/30">
                  <ListItem
                    icon={<Package size={16} className="text-amber-600" />}
                    iconClassName="bg-amber-100"
                    title={<span className="text-sm font-bold text-text-primary font-body truncate">{product.name}</span>}
                    actions={<>
                      <Button variant="primary" size="sm" leftIcon={<ThumbsUp size={12} />} isLoading={approveProduct.isPending} onClick={(e) => { e.stopPropagation(); approveProduct.mutate(product.id); }}>
                        {t('products.pendingApproval.approve')}
                      </Button>
                      <Button variant="secondary" size="sm" leftIcon={<ThumbsDown size={12} />} isLoading={rejectProduct.isPending} onClick={(e) => { e.stopPropagation(); rejectProduct.mutate(product.id); }}>
                        {t('products.pendingApproval.reject')}
                      </Button>
                    </>}
                  >
                    <p className="text-xs text-text-secondary font-body truncate">
                      {product.supplierName || 'No supplier'} · {product.categoryName}
                    </p>
                  </ListItem>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Products */}
      <Card padding="lg">
        <CardHeader
          action={
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate(ROUTES.PRODUCT_CREATE)}>
              {t('products.catalog.addProduct')}
            </Button>
          }
        >
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('products.catalog.title')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">
              {hasLowStock > 0 ? (
                <span className="text-status-warning font-bold">{t('products.catalog.lowStock', { count: hasLowStock })}</span>
              ) : (
                <>{t('products.catalog.productCount', { count: products.length })}</>
              )}
            </p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="w-full sm:flex-1 sm:max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('products.catalog.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}
              className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all appearance-none"
            >
              <option value="">{t('products.catalog.allCategories')}</option>
              {allCategories.map((c) => <option key={c.id} value={c.id}>{'  '.repeat(c.parentId ? 1 : 0)}{c.name}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="h-22 bg-gray-100 rounded-xl" />)}</div>
        ) : products.length === 0 ? (
          <EmptyState title={t('products.catalog.noProductsFound')} description={search ? t('products.catalog.tryDifferentSearch') : t('products.catalog.addFirstProduct')} />
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <ListItem
                key={product.id}
                onClick={() => navigate(ROUTES.PRODUCT_DETAIL(product.id))}
                hideIconOnMobile={!!product.imageUrl}
                icon={
                  product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full rounded-lg object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <Package size={16} className="text-brand-primary" />
                  )
                }
                title={<span className="text-sm font-bold text-text-primary font-body group-hover:text-brand-primary transition-colors truncate">{product.name}</span>}
                badges={<>
                  <span className="text-xs text-text-tertiary truncate hidden sm:inline">{product.nameAr}</span>
                  <Badge variant={SOURCE_BADGE[product.source] || 'gray'} size="sm">{product.source}</Badge>
                  {!product.isAvailable && <Badge variant="red" size="sm">{t('products.catalog.disabled')}</Badge>}
                  {product.isAvailable && product.stockQuantity < 20 && <Badge variant="yellow" size="sm">{t('products.catalog.lowStockBadge', { count: product.stockQuantity })}</Badge>}
                </>}
                actions={<>
                  <span className="text-sm font-extrabold text-text-primary font-display">{formatPrice(product.price)}</span>
                  <Button
                    variant={product.isAvailable ? 'secondary' : 'primary'}
                    size="sm"
                    isLoading={toggleAvailability.isPending}
                    onClick={(e) => { e.stopPropagation(); toggleAvailability.mutate(product.id); }}
                  >
                    {product.isAvailable ? t('products.catalog.disable') : t('products.catalog.enable')}
                  </Button>
                </>}
              >
                <p className="text-xs text-text-secondary font-body truncate">
                  {product.categoryName}{product.supplierName ? ` · ${product.supplierName}` : ''} · {product.totalOrders} orders
                </p>
              </ListItem>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
