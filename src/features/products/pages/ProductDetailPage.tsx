import { useParams, Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { useProduct } from '../hooks/useProducts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useBasketStore } from '@/features/basket/store/basketStore';

const BG_COLORS = [
  'from-blue-100 to-blue-200',
  'from-green-100 to-green-200',
  'from-amber-100 to-amber-200',
  'from-purple-100 to-purple-200',
];

function getProductColor(id: number): string {
  return BG_COLORS[id % BG_COLORS.length];
}

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const id = productId ? Number(productId) : undefined;
  const { data: product, isLoading, error, refetch } = useProduct(id);
  const addItem = useBasketStore((s) => s.addItem);
  const toggleBasket = useBasketStore((s) => s.toggleOpen);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <ErrorState
        title="Product not found"
        message={error?.message ?? 'The product you are looking for does not exist.'}
        onRetry={() => refetch()}
      />
    );
  }

  const handleAddToCart = () => {
    addItem(product);
    toggleBasket();
  };

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link
        to={ROUTES.CUSTOMER_CATALOG}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div
          className={`h-72 md:h-96 rounded-xl bg-gradient-to-br flex items-center justify-center ${getProductColor(product.id)}`}
        >
          <div className="text-center">
            <div className="text-6xl font-bold text-white/80">
              {product.name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="text-sm text-white/60 mt-2">{product.unit}</div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="gray" size="sm">{product.categoryName}</Badge>
              {product.isAvailable ? (
                <Badge variant="green" size="sm" dot>In Stock</Badge>
              ) : (
                <Badge variant="red" size="sm">Out of Stock</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-lg text-gray-500">{product.nameAr}</p>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-4 w-4 ${star <= Math.round(product.rating) ? 'text-amber-400' : 'text-gray-200'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              SAR {product.price.toFixed(2)}
            </span>
            <span className="text-sm text-gray-400">/{product.unit}</span>
          </div>

          {/* Stock */}
          <p className="text-sm text-gray-500">
            {product.stockQuantity > 0
              ? `${product.stockQuantity} ${product.unit}(s) available`
              : 'Currently out of stock'}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
              className="flex-1"
            >
              {product.isAvailable ? 'Add to Basket' : 'Unavailable'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
