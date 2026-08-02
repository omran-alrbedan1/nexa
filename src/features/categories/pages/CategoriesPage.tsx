import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { categoriesApi, type Category } from '../api/categoriesApi';
import { businessCategoriesApi, type BusinessCategory } from '../api/businessCategoriesApi';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListItem } from '@/components/ui/ListItem';
import { Pagination } from '@/components/ui/Pagination';
import { Tabs } from '@/components/ui/Tabs';
import { useToastStore } from '@/stores/toastStore';
import { ROUTES } from '@/routes/routes';
import {
  FolderTree, Plus, Pencil, Trash2, Layers, CheckCircle2, XCircle, Building2, Hash,
} from 'lucide-react';

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function CategoriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'product';

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [deleteBusinessModal, setDeleteBusinessModal] = useState<{ open: boolean; category: BusinessCategory | null }>({ open: false, category: null });
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['categories', page],
    queryFn: () => categoriesApi.getPageData({ page }),
    enabled: tab === 'product',
  });

  const {
    data: businessData,
    isLoading: businessLoading,
    isError: businessIsError,
    error: businessError,
    refetch: businessRefetch,
  } = useQuery({
    queryKey: ['business-categories', page],
    queryFn: () => businessCategoriesApi.getPageData({ page }),
    enabled: tab === 'business',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addToast('success', t('categories.toast.deleteSuccess'));
      setDeleteModal({ open: false, category: null });
    },
    onError: (err: any) => {
      addToast('error', err?.response?.data?.message || t('categories.toast.deleteFailed'));
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: (id: number) => businessCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-categories'] });
      addToast('success', t('categories.toast.businessDeleteSuccess'));
      setDeleteBusinessModal({ open: false, category: null });
    },
    onError: (err: any) => {
      addToast('error', err?.response?.data?.message || t('categories.toast.businessDeleteFailed'));
    },
  });

  const setTab = (tabId: string) => {
    setPage(1);
    setSearchParams(tabId === 'product' ? {} : { tab: tabId });
  };

  const categories = data?.categories ?? [];
  const productMeta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };
  const topLevelCategories = categories.filter((c) => !c.parentId);

  const businessCategories = businessData?.businessCategories ?? [];
  const businessMeta = businessData?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };

  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.isActive).length,
    inactive: categories.filter((c) => !c.isActive).length,
  };

  const businessStats = {
    total: businessCategories.length,
    active: businessCategories.filter((c) => c.isActive).length,
    inactive: businessCategories.filter((c) => !c.isActive).length,
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <FolderTree size={22} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('categories.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('categories.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-purple-500 via-brand-primary to-purple-500 rounded-full opacity-30" />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'product', label: t('categories.tabs.product') },
          { id: 'business', label: t('categories.tabs.business') },
        ]}
        activeTab={tab}
        onChange={setTab}
        variant="pills"
      />

      {/* Product Categories Content */}
      {tab === 'product' && (
        <>
          {isError ? (
            <ErrorState title={t('categories.errorTitle')} message={error instanceof Error ? error.message : t('categories.errorMessage')} onRetry={() => refetch()} />
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5">
                {[
                  { key: 'total', label: t('categories.stats.total'), icon: Layers, variant: 'purple' as const },
                  { key: 'active', label: t('categories.stats.active'), icon: CheckCircle2, variant: 'success' as const },
                  { key: 'inactive', label: t('categories.stats.inactive'), icon: XCircle, variant: 'coral' as const },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.key} padding="md" hover>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                          <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                            {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : stats[s.key as keyof typeof stats]}
                          </p>
                        </div>
                        <div className={cn(
                          'p-2.5 rounded-lg flex-shrink-0',
                          s.variant === 'purple' ? 'bg-purple-50 text-purple-600' :
                          s.variant === 'success' ? 'bg-green-50 text-green-600' :
                          'bg-brand-accent-light text-brand-accent'
                        )}>
                          <Icon size={18} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* List */}
              <Card padding="lg">
                <CardHeader
                  action={
                    <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate(ROUTES.CATEGORIES_CREATE)}>
                      {t('categories.list.addCategory')}
                    </Button>
                  }
                >
                  <div>
                    <h3 className="text-sm font-bold text-text-primary font-display">{t('categories.list.allCategories')}</h3>
                    <p className="text-xs text-text-secondary font-body mt-0.5">{productMeta.total} {t('common.items')}</p>
                  </div>
                </CardHeader>

                {isLoading ? (
                  <div className="space-y-3 animate-pulse">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
                ) : topLevelCategories.length === 0 ? (
                  <EmptyState title={t('categories.list.noCategories')} description={t('categories.list.noCategoriesDescription')} action={
                    <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate(ROUTES.CATEGORIES_CREATE)}>
                      {t('categories.list.addCategory')}
                    </Button>
                  } />
                ) : (
                  <div className="space-y-2">
                    {topLevelCategories.map((cat) => (
                      <CategoryListItem
                        key={cat.id}
                        category={cat}
                        allCategories={categories}
                        onEdit={(c) => navigate(ROUTES.CATEGORIES_EDIT(c.id))}
                        onDelete={(c) => setDeleteModal({ open: true, category: c })}
                      />
                    ))}
                  </div>
                )}
                <Pagination
                  currentPage={productMeta.currentPage}
                  lastPage={productMeta.lastPage}
                  total={productMeta.total}
                  perPage={15}
                  onPageChange={(p) => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </Card>

              {/* Delete Modal */}
              <Modal
                open={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, category: null })}
                size="sm"
                title={deleteModal.category ? t('categories.deleteTitle', { name: deleteModal.category.nameAr }) : t('categories.deleteTitle', { name: '' })}
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                    <Trash2 size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-text-secondary font-body">
                      {t('categories.deleteConfirm', { name: deleteModal.category?.nameAr })}
                      {deleteModal.category && deleteModal.category.productsCount > 0 && (
                        <span className="block mt-1 text-red-600 font-bold">
                          {t('categories.deleteWarning', { count: deleteModal.category.productsCount })}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="secondary" size="sm" onClick={() => setDeleteModal({ open: false, category: null })}>{t('categories.cancel')}</Button>
                    <Button
                      variant="danger" size="sm" leftIcon={<Trash2 size={14} />}
                      isLoading={deleteMutation.isPending}
                      onClick={() => deleteModal.category && deleteMutation.mutate(deleteModal.category.id)}
                    >
                      {t('categories.delete')}
                    </Button>
                  </div>
                </div>
              </Modal>
            </>
          )}
        </>
      )}

      {/* Business Categories Content */}
      {tab === 'business' && (
        <>
          {businessIsError ? (
            <ErrorState title={t('categories.errorTitle')} message={businessError instanceof Error ? businessError.message : t('categories.errorMessage')} onRetry={() => businessRefetch()} />
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5">
                {[
                  { key: 'total', label: t('categories.stats.totalBusiness'), icon: Building2, variant: 'emerald' as const },
                  { key: 'active', label: t('categories.stats.active'), icon: CheckCircle2, variant: 'success' as const },
                  { key: 'inactive', label: t('categories.stats.inactive'), icon: XCircle, variant: 'coral' as const },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.key} padding="md" hover>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                          <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                            {businessLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : businessStats[s.key as keyof typeof businessStats]}
                          </p>
                        </div>
                        <div className={cn(
                          'p-2.5 rounded-lg flex-shrink-0',
                          s.variant === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                          s.variant === 'success' ? 'bg-green-50 text-green-600' :
                          'bg-brand-accent-light text-brand-accent'
                        )}>
                          <Icon size={18} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* List */}
              <Card padding="lg">
                <CardHeader
                  action={
                    <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate(ROUTES.BUSINESS_CATEGORIES_CREATE)}>
                      {t('categories.list.addBusinessCategory')}
                    </Button>
                  }
                >
                  <div>
                    <h3 className="text-sm font-bold text-text-primary font-display">{t('categories.list.allBusinessCategories')}</h3>
                    <p className="text-xs text-text-secondary font-body mt-0.5">{businessMeta.total} {t('common.items')}</p>
                  </div>
                </CardHeader>

                {businessLoading ? (
                  <div className="space-y-3 animate-pulse">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
                ) : businessCategories.length === 0 ? (
                  <EmptyState title={t('categories.list.noBusinessCategories')} description={t('categories.list.noBusinessCategoriesDescription')} action={
                    <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate(ROUTES.BUSINESS_CATEGORIES_CREATE)}>
                      {t('categories.list.addBusinessCategory')}
                    </Button>
                  } />
                ) : (
                  <div className="space-y-2">
                    {businessCategories.map((cat) => (
                      <BusinessCategoryListItem
                        key={cat.id}
                        category={cat}
                        onEdit={(c) => navigate(ROUTES.BUSINESS_CATEGORIES_EDIT(c.id))}
                        onDelete={(c) => setDeleteBusinessModal({ open: true, category: c })}
                      />
                    ))}
                  </div>
                )}
                <Pagination
                  currentPage={businessMeta.currentPage}
                  lastPage={businessMeta.lastPage}
                  total={businessMeta.total}
                  perPage={15}
                  onPageChange={(p) => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </Card>

              {/* Delete Modal */}
              <Modal
                open={deleteBusinessModal.open}
                onClose={() => setDeleteBusinessModal({ open: false, category: null })}
                size="sm"
                title={t('categories.deleteBusinessTitle')}
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                    <Trash2 size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-text-secondary font-body">
                      {t('categories.deleteBusinessConfirm', { name: deleteBusinessModal.category?.nameAr })}
                      {deleteBusinessModal.category && deleteBusinessModal.category.suppliersCount > 0 && (
                        <span className="block mt-1 text-red-600 font-bold">
                          {t('categories.deleteBusinessWarning', { count: deleteBusinessModal.category.suppliersCount })}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="secondary" size="sm" onClick={() => setDeleteBusinessModal({ open: false, category: null })}>{t('categories.cancel')}</Button>
                    <Button
                      variant="danger" size="sm" leftIcon={<Trash2 size={14} />}
                      isLoading={deleteBusinessMutation.isPending}
                      onClick={() => deleteBusinessModal.category && deleteBusinessMutation.mutate(deleteBusinessModal.category.id)}
                    >
                      {t('categories.delete')}
                    </Button>
                  </div>
                </div>
              </Modal>
            </>
          )}
        </>
      )}
    </div>
  );
}

// --------------- Product Category List Item ---------------

interface CategoryListItemProps {
  category: Category;
  allCategories: Category[];
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}

function CategoryListItem({ category, allCategories, onEdit, onDelete }: CategoryListItemProps) {
  const { t } = useTranslation();
  const children = allCategories.filter((c) => c.parentId === category.id);

  return (
    <div className="rounded-xl border border-border-default/60 hover:border-border-default transition-colors">
      <ListItem
        icon={<FolderTree size={16} className="text-purple-600" />}
        iconClassName="bg-purple-50"
        title={<span className="text-sm font-bold text-text-primary font-body truncate">{category.nameAr}</span>}
        badges={<>
          {category.nameEn && (
            <span className="text-xs text-text-tertiary truncate hidden sm:inline">{category.nameEn}</span>
          )}
          {category.parent && (
            <span className="text-xs text-text-tertiary">{t('categories.subLabel', { name: category.parent.name_ar })}</span>
          )}
          <Badge variant={category.isActive ? 'green' : 'red'} size="sm">
            {category.isActive ? t('common.active') : t('common.inactive')}
          </Badge>
        </>}
        actions={<>
          {children.length > 0 && (
            <span className="text-xs text-text-secondary mr-1">{t('categories.sub', { count: children.length })}</span>
          )}
          <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={(e) => { e.stopPropagation(); onEdit(category); }}>
            {t('categories.edit')}
          </Button>
          <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} onClick={(e) => { e.stopPropagation(); onDelete(category); }} className="text-red-500 hover:text-red-700">
            {t('categories.delete')}
          </Button>
        </>}
      >
        <p className="text-xs text-text-secondary font-body">
          {t('categories.sortLabel', { order: category.sortOrder })} &middot; {t('categories.productsCount', { count: category.productsCount })}
        </p>
      </ListItem>
    </div>
  );
}

// --------------- Business Category List Item ---------------

interface BusinessCategoryListItemProps {
  category: BusinessCategory;
  onEdit: (c: BusinessCategory) => void;
  onDelete: (c: BusinessCategory) => void;
}

function BusinessCategoryListItem({ category, onEdit, onDelete }: BusinessCategoryListItemProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border-default/60 hover:border-border-default transition-colors">
      <ListItem
        icon={<Building2 size={16} className="text-emerald-600" />}
        iconClassName="bg-emerald-50"
        title={<span className="text-sm font-bold text-text-primary font-body truncate">{category.nameAr}</span>}
        badges={<>
          {category.nameEn && (
            <span className="text-xs text-text-tertiary truncate hidden sm:inline">{category.nameEn}</span>
          )}
          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
            <Hash size={10} />
            {category.code}
          </span>
          <Badge variant={category.isActive ? 'green' : 'red'} size="sm">
            {category.isActive ? t('common.active') : t('common.inactive')}
          </Badge>
        </>}
        actions={<>
          <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={(e) => { e.stopPropagation(); onEdit(category); }}>
            {t('categories.edit')}
          </Button>
          <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} onClick={(e) => { e.stopPropagation(); onDelete(category); }} className="text-red-500 hover:text-red-700">
            {t('categories.delete')}
          </Button>
        </>}
      >
        <p className="text-xs text-text-secondary font-body">
          {t('categories.sortLabel', { order: category.sortOrder })} &middot; {t('categories.suppliersCount', { count: category.suppliersCount })}
        </p>
      </ListItem>
    </div>
  );
}
