import { cn } from '@/utils/cn';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { CategoryData } from '../api/productsApi';

interface CategorySidebarProps {
  categories: CategoryData[];
  selectedCategoryId: number | undefined;
  onSelect: (categoryId: number | undefined) => void;
  isLoading: boolean;
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelect,
  isLoading,
}: CategorySidebarProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Categories
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <>
          <button
            onClick={() => onSelect(undefined)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
              !selectedCategoryId
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                selectedCategoryId === cat.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span>{cat.name}</span>
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  selectedCategoryId === cat.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {cat.productCount}
              </span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
