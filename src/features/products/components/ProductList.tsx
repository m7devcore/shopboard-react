import type { Product } from '../../../modules/products/products.types.ts'
import type { AddableProduct } from '../../../modules/cart/cart.types.ts'
import ProductCard from './ProductCard.tsx'

export interface ProductListProps {
  readonly products: readonly Product[]
  readonly onAddToCart: (product: AddableProduct) => void
}

export default function ProductList({
  products,
  onAddToCart,
}: ProductListProps) {
  return (
    <section className="product-grid-section" aria-label="Product Catalog">
      <ul className="product-grid" role="list">
        {products.map((product) => (
          <li key={product.id} className="product-grid-item">
            <ProductCard product={product} onAddToCart={onAddToCart} />
          </li>
        ))}
      </ul>
    </section>
  )
}
