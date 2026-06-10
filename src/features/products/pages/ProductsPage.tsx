import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductsPage, useToggleProductAvailability } from '../hooks/useProductsAdmin';
import { ROUTES } from '@/routes/routes';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToastStore } from '@/stores/toastStore';
import { Package, CheckCircle2, AlertTriangle, Layers, Users, TrendingUp, Plus, Search, Filter } from 'lucide-react';

const SOURCE_BADGE: Record<string, 'teal' | 'purple' | 'yellow'> = { supplier: 'teal', internal: 'purple', seasonal: 'yellow' };

const STAT_CONFIG = [
  { key: 'totalProducts', label: 'Total Products', icon: Package, variant: 'teal' as const },
  { key: 'available', label: 'Available', icon: CheckCircle2, variant: 'success' as const },
  { key: 'outOfStock', label: 'Out of Stock', icon: AlertTriangle, variant: 'coral' as const },
  { key: 'categories', label: 'Categories', icon: Layers, variant: 'purple' as const },
  { key: 'suppliers', label: 'Suppliers', icon: Users, variant: 'warning' as const },
  { key: 'avgPrice', label: 'Avg Price', icon: TrendingUp, variant: 'teal' as const, suffix: ' SAR' },
];

export function ProductsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useProductsPage();
  const toggleAvailability = useToggleProductAvailability();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');

  if (isError) return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary font-display">Products</h1>
        <p className="text-sm text-text-secondary font-body mt-1">Manage product catalog, categories, and inventory</p>
      </div>
      <ErrorState title="Failed to load products" message={error instanceof Error ? error.message : 'An error occurred'} onRetry={() => refetch()} />
    </div>
  );

  const stats = data?.stats;
  const categories = data?.categories ?? [];
  const products = (data?.products ?? []).filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.supplierName?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const allCategories = categories.flatMap((c) => [c, ...(c.children || [])]);
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
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">Products</h1>
              <p className="text-sm text-text-secondary font-body">Manage product catalog, categories, and inventory</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
        {STAT_CONFIG.map((s) => {
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

      {/* Products */}
      <Card padding="lg">
        <CardHeader
          action={
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => useToastStore.getState().addToast('info', 'Create product form coming soon')}>
              Add Product
            </Button>
          }
        >
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">Product Catalog</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">
              {hasLowStock > 0 ? (
                <span className="text-status-warning font-bold">{hasLowStock} items low stock</span>
              ) : (
                <>{products.length} products</>
              )}
            </p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
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
              <option value="">All Categories</option>
              {allCategories.map((c) => <option key={c.id} value={c.id}>{'  '.repeat(c.parentId ? 1 : 0)}{c.name}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="h-22 bg-gray-100 rounded-xl" />)}</div>
        ) : products.length === 0 ? (
          <EmptyState title="No products found" description={search ? 'Try a different search term' : 'Add your first product to the catalog'} />
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between py-3.5 px-4 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all cursor-pointer group"
                onClick={() => navigate(ROUTES.PRODUCT_DETAIL(product.id))}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary-light flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-brand-primary" />
                    </div>
                    <span className="text-sm font-bold text-text-primary font-body group-hover:text-brand-primary transition-colors">{product.name}</span>
                    <span className="text-xs text-text-tertiary">{product.nameAr}</span>
                    <Badge variant={SOURCE_BADGE[product.source] || 'gray'} size="sm">{product.source}</Badge>
                    {!product.isAvailable && <Badge variant="red" size="sm">Disabled</Badge>}
                    {product.isAvailable && product.stockQuantity < 20 && <Badge variant="yellow" size="sm">Low Stock ({product.stockQuantity})</Badge>}
                  </div>
                  <p className="text-xs text-text-secondary font-body mt-1.5 ml-10">
                    {product.categoryName}{product.supplierName ? ` · ${product.supplierName}` : ''} · {product.totalOrders} orders
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span className="text-sm font-extrabold text-text-primary font-display">{product.price.toFixed(2)} <span className="text-text-tertiary text-xs font-body">SAR</span></span>
                  <Button
                    variant={product.isAvailable ? 'secondary' : 'primary'}
                    size="sm"
                    isLoading={toggleAvailability.isPending}
                    onClick={(e) => { e.stopPropagation(); toggleAvailability.mutate(product.id); }}
                  >
                    {product.isAvailable ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
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
