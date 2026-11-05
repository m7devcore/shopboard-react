import type { Product } from '../modules/products/products.types.ts'
import type { AddableProduct } from '../modules/cart/cart.types.ts'

export interface ProductCardProps {
  readonly product: Product
  readonly onAddToCart: (product: AddableProduct) => void
}

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatPrice(amount: number): string {
  return USD_FORMATTER.format(amount)
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const { id, name, category, price, inStock, description } = product

  const handleAddToCart = () => {
    if (inStock) {
      onAddToCart(product)
    }
  }

  return (
    <article
      className={`product-card ${inStock ? 'in-stock' : 'out-of-stock'}`}
      aria-labelledby={`product-title-${id}`}
    >
      <div className="product-card-header">
        <span className="product-category">{category}</span>
        <span
          className={`stock-badge ${inStock ? 'badge-in-stock' : 'badge-out-of-stock'}`}
          role="status"
        >
          {inStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>

      <div className="product-card-body">
        <h2 id={`product-title-${id}`} className="product-title">
          {name}
        </h2>
        {description ? (
          <p className="product-description">{description}</p>
        ) : null}
      </div>

      <div className="product-card-footer">
        <span
          className="product-price"
          aria-label={`Price: ${formatPrice(price)}`}
        >
          {formatPrice(price)}
        </span>
        <button
          type="button"
          className="btn-add-to-cart"
          onClick={handleAddToCart}
          disabled={!inStock}
          aria-label={
            inStock ? `Add ${name} to cart` : `${name} is out of stock`
          }
        >
          {inStock ? 'Add to Cart' : 'Sold Out'}
        </button>
      </div>
    </article>
  )
}
