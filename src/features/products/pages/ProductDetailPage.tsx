import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { productsApi, type DashboardProduct } from '../api/productsApi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { productKeys } from '../hooks/useProductsAdmin';
import {
  ArrowLeft, Package, Star, ShoppingCart, TrendingUp, Building2,
  Tag, Hash, Ruler, Image, CheckCircle2, XCircle, AlertTriangle, Layers, Users,
} from 'lucide-react';

const SOURCE_BADGE: Record<string, 'teal' | 'purple' | 'yellow'> = {
  supplier: 'teal', internal: 'purple', seasonal: 'yellow',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const id = parseInt(productId || '0', 10);
  const { t } = useTranslation();

  const { data: product, isLoading, isError, error, refetch } = useQuery<DashboardProduct>({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.getProduct(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.PRODUCTS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('products.detail.back')}
        </button>
        <ErrorState
          title={t('products.detail.errorTitle')}
          message={error instanceof Error ? error.message : 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading || !product) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const stockPercent = Math.min((product.stockQuantity / (product.stockQuantity + 50)) * 100, 100);
  const isLowStock = product.isAvailable && product.stockQuantity < 20;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back */}
      <button onClick={() => navigate(ROUTES.PRODUCTS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('products.detail.back')}
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Package size={28} className="text-brand-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{product.name}</h1>
                <span className="text-sm text-text-tertiary">{product.nameAr}</span>
                <Badge variant={SOURCE_BADGE[product.source] || 'gray'} size="sm">{product.source}</Badge>
                {product.isAvailable ? (
                  <Badge variant="green" size="sm">{t('products.detail.active')}</Badge>
                ) : (
                  <Badge variant="red" size="sm">{t('products.detail.disabled')}</Badge>
                )}
              </div>
              <p className="text-sm text-text-secondary font-body mt-1 line-clamp-2">{product.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="secondary" size="sm" leftIcon={<Package size={14} />} onClick={() => navigate(ROUTES.PRODUCT_EDIT(product.id))}>
                {t('common.edit')}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <Card padding="md" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('products.detail.price')}</p>
              <p className="text-2xl font-extrabold text-brand-accent font-display mt-1">{product.price.toFixed(2)}</p>
              <p className="text-xs text-text-tertiary font-body">{t('products.detail.perUnit', { unit: product.unit })}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-brand-accent-light text-brand-accent">
              <TrendingUp size={18} />
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('products.detail.stock')}</p>
              <p className="text-2xl font-extrabold text-text-primary font-display mt-1">{product.stockQuantity}</p>
              <p className="text-xs text-text-tertiary font-body">{product.unit}s</p>
            </div>
            <div className={cn('p-2.5 rounded-lg', isLowStock ? 'bg-amber-50 text-amber-600' : 'bg-brand-primary-light text-brand-primary')}>
              <Package size={18} />
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('products.detail.category')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display mt-1 truncate max-w-[120px]">{product.categoryName}</p>
              <p className="text-xs text-text-tertiary font-body"><Layers size={10} className="inline" /> ID: {product.categoryId}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <Layers size={18} />
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('products.detail.orders')}</p>
              <p className="text-2xl font-extrabold text-text-primary font-display mt-1">{product.totalOrders}</p>
              <p className="text-xs text-text-tertiary font-body"><ShoppingCart size={10} className="inline" /> {t('products.detail.total')}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
              <ShoppingCart size={18} />
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Bar */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('products.detail.stockLevel')}</h3>
          </div>
          {isLowStock && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
              <AlertTriangle size={12} />
              {t('products.detail.lowStock')}
            </div>
          )}
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isLowStock ? 'bg-amber-500' : stockPercent > 60 ? 'bg-green-500' : 'bg-brand-primary'
            )}
            style={{ width: `${stockPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-text-secondary font-body">
          <span>{t('products.detail.inStock', { count: product.stockQuantity, unit: product.unit })}</span>
          <span>{t('products.detail.relativeStock', { percent: stockPercent.toFixed(0) })}</span>
        </div>
      </Card>

      {/* Two-column info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Details */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('products.detail.productDetails')}</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><Hash size={12} /> {t('products.detail.sku')}</span>
              <span className="font-bold text-text-primary">{product.nameAr ? `SKU-${product.id}` : '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><Package size={12} /> {t('products.detail.unit')}</span>
              <span className="font-bold text-text-primary">{product.unit}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><Layers size={12} /> {t('products.detail.category')}</span>
              <span className="font-bold text-text-primary">{product.categoryName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><TrendingUp size={12} /> {t('products.detail.price')}</span>
              <span className="font-extrabold text-brand-accent">{product.price.toFixed(2)} SAR</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><Image size={12} /> {t('products.detail.image')}</span>
              <span className="font-bold text-text-primary">{product.imageUrl || t('products.detail.noImage')}</span>
            </div>
          </div>
        </Card>

        {/* Supplier Info */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('products.detail.supplierInfo')}</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><Building2 size={12} /> {t('products.detail.supplier')}</span>
              <span className="font-bold text-text-primary">{product.supplierName || t('products.catalog.internal')}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><Users size={12} /> {t('products.detail.source')}</span>
              <Badge variant={SOURCE_BADGE[product.source] || 'gray'} size="sm">{product.source}</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><CheckCircle2 size={12} /> {t('products.detail.status')}</span>
              {product.isAvailable ? (
                <span className="font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> {t('products.detail.active')}</span>
              ) : (
                <span className="font-bold text-red-500 flex items-center gap-1"><XCircle size={12} /> {t('products.detail.disabled')}</span>
              )}
            </div>
            <div className="flex items-center justify-between py-2 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><ShoppingCart size={12} /> {t('products.detail.totalOrders')}</span>
              <span className="font-bold text-text-primary">{product.totalOrders}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Description */}
      {(product.description || product.descriptionAr) && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('products.detail.description')}</h3>
          </div>
          <div className="space-y-3 text-sm font-body">
            {product.description && <p className="text-text-primary">{product.description}</p>}
            {product.descriptionAr && (
              <p className="text-text-secondary text-right" dir="rtl">{product.descriptionAr}</p>
            )}
          </div>
        </Card>
      )}

      {/* Placeholder sections */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-brand-accent" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('products.detail.stockMovements')}</h3>
        </div>
        <p className="text-sm text-text-secondary font-body">
          {t('products.detail.stockMovementsPlaceholder')}
        </p>
      </Card>
    </div>
  );
}
