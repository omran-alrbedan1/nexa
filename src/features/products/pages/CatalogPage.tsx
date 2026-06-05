import { useState, useCallback } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductGrid } from '../components/ProductGrid';
import { CategorySidebar } from '../components/CategorySidebar';
import { SearchInput } from '@/components/ui/SearchInput';
import { useDebounce } from '@/hooks/useDebounce';
import { useBasketStore } from '@/features/basket/store/basketStore';
import type { ProductData } from '../api/productsApi';

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 300);
  const addItem = useBasketStore((s) => s.addItem);
  const itemCount = useBasketStore((s) => s.itemCount());
  const toggleBasket = useBasketStore((s) => s.toggleOpen);

  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useCategories();

  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts({
    categoryId: selectedCategoryId,
    search: debouncedSearch || undefined,
  });

  const handleAddToCart = useCallback(
    (product: ProductData) => {
      addItem(product);
    },
    [addItem]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse our products and add to your basket
          </p>
        </div>
        <button
          onClick={toggleBasket}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open basket"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search products..."
        />
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 hidden md:block">
          <div className="sticky top-0">
            <CategorySidebar
              categories={categories ?? []}
              selectedCategoryId={selectedCategoryId}
              onSelect={(id) => {
                setSelectedCategoryId(id);
              }}
              isLoading={categoriesLoading}
            />
          </div>
        </aside>

        {/* Product grid */}
        <main className="flex-1 min-w-0">
          <ProductGrid
            products={products ?? []}
            isLoading={productsLoading}
            error={productsError}
            onAddToCart={handleAddToCart}
            onRetry={() => refetchProducts()}
          />
        </main>
      </div>

      {/* Mobile category filter */}
      <div className="md:hidden mt-4">
        <select
          value={selectedCategoryId ?? ''}
          onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Categories</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.productCount})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
