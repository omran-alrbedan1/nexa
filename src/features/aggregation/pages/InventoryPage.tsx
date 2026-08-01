import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, type DashboardProduct } from '@/features/products/api/productsApi';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useToastStore } from '@/stores/toastStore';
import { ListItem } from '@/components/ui/ListItem';
import {
  Package, AlertTriangle, CheckCircle2, XCircle, Search,
  Plus, Minus,
} from 'lucide-react';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { productKeys } from '@/features/products/hooks/useProductsAdmin';

const STAT_CONFIG = [
  { key: 'total', labelKey: 'aggregation.inventory.statTotalSkus', icon: Package, variant: 'teal' as const },
  { key: 'inStock', labelKey: 'aggregation.inventory.statInStock', icon: CheckCircle2, variant: 'success' as const },
  { key: 'lowStock', labelKey: 'aggregation.inventory.statLowStock', icon: AlertTriangle, variant: 'warning' as const },
  { key: 'outOfStock', labelKey: 'aggregation.inventory.statOutOfStock', icon: XCircle, variant: 'coral' as const },
];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function InventoryPage() {
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...productKeys.pageData(), { page, search: debouncedSearch || undefined }],
    queryFn: () => productsApi.getPageData({ page, search: debouncedSearch || undefined }),
    staleTime: 30_000,
  });

  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [stockModal, setStockModal] = useState<{ open: boolean; product: DashboardProduct | null; adjustment: number; reason: string }>({
    open: false, product: null, adjustment: 0, reason: '',
  });

  const adjustStock = useMutation({
    mutationFn: ({ id, adjustment, reason }: { id: number; adjustment: number; reason: string }) =>
      productsApi.adjustStock(id, Math.abs(adjustment), reason, adjustment >= 0 ? 'add' : 'deduct'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.pageData() });
      addToast('success', 'Stock adjusted successfully');
    },
    onError: () => addToast('error', 'Failed to adjust stock'),
  });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <ErrorState title={t('aggregation.inventory.errorTitle')} message={error instanceof Error ? error.message : t('aggregation.inventory.errorMessage')} onRetry={() => refetch()} />
      </div>
    );
  }

  const products = data?.products ?? [];
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };

  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.isAvailable && p.stockQuantity >= 20).length,
    lowStock: products.filter((p) => p.isAvailable && p.stockQuantity > 0 && p.stockQuantity < 20).length,
    outOfStock: products.filter((p) => !p.isAvailable || p.stockQuantity === 0).length,
  };

  const lowStockItems = products.filter((p) => p.isAvailable && p.stockQuantity > 0 && p.stockQuantity < 20);

  const handleAdjustStock = () => {
    if (!stockModal.product || stockModal.adjustment === 0) return;
    adjustStock.mutate(
      { id: stockModal.product.id, adjustment: stockModal.adjustment, reason: stockModal.reason },
      { onSettled: () => setStockModal({ open: false, product: null, adjustment: 0, reason: '' }) }
    );
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Package size={22} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('aggregation.inventory.title')}</h1>
            <p className="text-sm text-text-secondary font-body">{t('aggregation.inventory.description')}</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {STAT_CONFIG.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t(s.labelKey)}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : stats[s.key as keyof typeof stats]}
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

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800 font-display">{t('aggregation.inventory.lowStockTitle')}</h3>
            <span className="text-xs text-amber-600">({lowStockItems.length})</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {lowStockItems.map((item) => (
              <span key={item.id} className="text-xs bg-white px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 font-body">
                {item.name} — <span className="font-bold">{item.stockQuantity} {item.unit}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('aggregation.inventory.stockOverviewTitle')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('aggregation.inventory.productCount', { count: meta.total })}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-full sm:max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('aggregation.inventory.searchPlaceholder')} className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
        ) : products.length === 0 ? (
          <EmptyState title={t('aggregation.inventory.noProducts')} description={search ? t('aggregation.inventory.tryDifferentSearch') : t('aggregation.inventory.noProductsInInventory')} />
        ) : (
          <div className="space-y-2">
            {products.map((product) => {
              const maxEst = Math.max(product.stockQuantity, 50);
              const stockPercent = Math.min((product.stockQuantity / maxEst) * 100, 100);
              const isLow = product.isAvailable && product.stockQuantity > 0 && product.stockQuantity < 20;
              return (
                <ListItem
                  key={product.id}
                  icon={<Package size={16} className="text-brand-primary" />}
                  title={<span className="text-sm font-bold text-text-primary font-body truncate">{product.name}</span>}
                  badges={<>
                    {!product.isAvailable && <Badge variant="red" size="sm">{t('aggregation.inventory.disabled')}</Badge>}
                    {isLow && <Badge variant="yellow" size="sm">{t('aggregation.inventory.lowStock')}</Badge>}
                    {product.stockQuantity === 0 && <Badge variant="red" size="sm">{t('aggregation.inventory.outOfStock')}</Badge>}
                  </>}
                  actions={
                    <Button variant="secondary" size="sm" leftIcon={<Plus size={12} />} onClick={() => setStockModal({ open: true, product, adjustment: 10, reason: t('aggregation.inventory.restock') })}>
                      {t('aggregation.inventory.restock')}
                    </Button>
                  }
                >
                  <div className="flex items-center gap-4 text-xs text-text-secondary font-body flex-wrap">
                    <span className="font-bold text-text-primary">{product.stockQuantity}</span> {product.unit}s
                    <span>{formatPrice(product.price)}</span>
                    {product.supplierName && <span>{product.supplierName}</span>}
                  </div>
                  <div className="w-full max-w-xs h-2 rounded-full bg-gray-100 mt-1.5 overflow-hidden">
                    <div className={cn('h-full rounded-full', isLow ? 'bg-amber-500' : product.stockQuantity === 0 ? 'bg-red-400' : 'bg-green-500')} style={{ width: `${stockPercent}%` }} />
                  </div>
                </ListItem>
              );
            })}
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

      <Modal open={stockModal.open} onClose={() => setStockModal({ ...stockModal, open: false })} title={t('aggregation.inventory.adjustStockTitle', { name: stockModal.product?.name })}>
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-bg-section-alt">
            <p className="text-sm text-text-secondary font-body">{t('aggregation.inventory.currentStock', { quantity: stockModal.product?.stockQuantity, unit: stockModal.product?.unit })}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="sm" leftIcon={<Minus size={14} />} onClick={() => setStockModal((prev) => ({ ...prev, adjustment: -10 }))}>
              {t('aggregation.inventory.remove10')}
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setStockModal((prev) => ({ ...prev, adjustment: 10 }))}>
              {t('aggregation.inventory.add10')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="sm" onClick={() => setStockModal((prev) => ({ ...prev, adjustment: -50 }))}>{t('aggregation.inventory.remove50')}</Button>
            <Button variant="primary" size="sm" onClick={() => setStockModal((prev) => ({ ...prev, adjustment: 50 }))}>{t('aggregation.inventory.add50')}</Button>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('aggregation.inventory.customAdjustment')}</label>
            <input type="number" value={stockModal.adjustment} onChange={(e) => setStockModal((prev) => ({ ...prev, adjustment: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('aggregation.inventory.reason')}</label>
            <input value={stockModal.reason} onChange={(e) => setStockModal((prev) => ({ ...prev, reason: e.target.value }))} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('aggregation.inventory.reasonPlaceholder')} />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setStockModal({ ...stockModal, open: false })}>{t('aggregation.inventory.cancel')}</Button>
            <Button variant="primary" size="sm" disabled={stockModal.adjustment === 0} isLoading={adjustStock.isPending} onClick={handleAdjustStock}>
              {stockModal.adjustment > 0 ? t('aggregation.inventory.addStock', { count: stockModal.adjustment }) : t('aggregation.inventory.removeStock', { count: Math.abs(stockModal.adjustment) })}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
