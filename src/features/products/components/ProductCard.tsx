import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import type { ProductData } from '../api/productsApi';

const BG_COLORS = [
  'from-blue-100 to-blue-200',
  'from-green-100 to-green-200',
  'from-amber-100 to-amber-200',
  'from-purple-100 to-purple-200',
  'from-pink-100 to-pink-200',
  'from-teal-100 to-teal-200',
  'from-orange-100 to-orange-200',
  'from-indigo-100 to-indigo-200',
];

function getProductColor(id: number): string {
  return BG_COLORS[id % BG_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn('h-3.5 w-3.5', star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">({rating})</span>
    </div>
  );
}

interface ProductCardProps {
  product: ProductData;
  onAddToCart: (product: ProductData) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5">
      {/* Image placeholder */}
      <div
        className={cn(
          'h-40 bg-gradient-to-br flex items-center justify-center',
          getProductColor(product.id)
        )}
      >
        <div className="text-center">
          <div className="text-3xl font-bold text-white/80">
            {getInitials(product.name)}
          </div>
          <div className="text-xs text-white/60 mt-1">{product.unit}</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
            {product.name}
          </h3>
          {!product.isAvailable && (
            <span className="text-xs text-red-500 font-medium flex-shrink-0">Out of stock</span>
          )}
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        <StarRating rating={product.rating} />

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-lg font-bold text-gray-900">SAR {product.price.toFixed(2)}</span>
            <span className="text-xs text-gray-400 ml-1">/{product.unit}</span>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onAddToCart(product)}
            disabled={!product.isAvailable}
            className="!px-3 !py-1.5 text-xs"
          >
            {product.isAvailable ? 'Add' : 'N/A'}
          </Button>
        </div>
      </div>
    </div>
  );
}
