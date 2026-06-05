import { cn } from '@/utils/cn';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
  perPage?: number;
}

export function Pagination({
  currentPage,
  lastPage,
  total,
  onPageChange,
  perPage,
}: PaginationProps) {
  if (lastPage <= 1) return null;

  const from = (currentPage - 1) * (perPage || 1) + 1;
  const to = Math.min(currentPage * (perPage || 1), total);

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 1;

    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(lastPage - 1, currentPage + delta);

    pages.push(1);

    if (rangeStart > 2) {
      pages.push('ellipsis');
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < lastPage - 1) {
      pages.push('ellipsis');
    }

    if (lastPage > 1) {
      pages.push(lastPage);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium">{from}</span> to{' '}
        <span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            'px-3 py-1.5 text-sm border border-gray-300 rounded-md transition-colors',
            'hover:bg-gray-50',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Previous page"
        >
          Previous
        </button>

        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'px-3 py-1.5 text-sm border rounded-md transition-colors',
                page === currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              )}
              aria-current={page === currentPage ? 'page' : undefined}
              aria-label={`Page ${page}`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= lastPage}
          className={cn(
            'px-3 py-1.5 text-sm border border-gray-300 rounded-md transition-colors',
            'hover:bg-gray-50',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Next page"
        >
          Next
        </button>
      </nav>
    </div>
  );
}
