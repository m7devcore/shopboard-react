# ShopBoard React Storefront — CorePro Day 4

A strictly typed React 19 storefront application built on top of the preserved Day 3 ShopBoard business logic, HTTP client, runtime validation mappers, and `localStorage` cart engine.

---

## 1. Project Overview

**ShopBoard React** migrates the Day 3 vanilla TypeScript storefront UI to a declarative, component-based React architecture while preserving 100% byte-for-byte parity across all eight core domain modules (`client.ts`, `products.*`, `cart.*`, and `artworks.types.ts`).

The application separates pure domain logic and API boundary validation from presentational and container React components:

- **Container (`App`)**: Owns catalog fetch lifecycle, search/filter/sort criteria, shopping cart state, and cart modal visibility.
- **Presentational Components (`Header`, `StatusMessage`, `ProductToolbar`, `ProductList`, `ProductCard`, `CartPanel`, `CartRow`)**: Strictly typed, accessible UI components communicating upward exclusively through explicit callback props.

---

## 2. Tech Stack

- **UI Library**: React 19 (`react`, `react-dom`)
- **Build Tool & Dev Server**: Vite (`vite`, `@vitejs/plugin-react`)
- **Language**: TypeScript (`typescript`, strict mode enabled)
- **Linter**: Oxlint (`oxlint --deny-warnings`)
- **Formatter**: Prettier (`prettier`)
- **Git Hooks**: Husky + `lint-staged` (runs `oxlint --deny-warnings` and `prettier --write` on staged files)

---

## 3. Setup & Run Commands

```bash
# Install dependencies deterministically
npm ci

# Start Vite development server (React StrictMode active)
npm run dev

# Type-check with TypeScript compiler
npm run typecheck

# Lint all source files (zero warnings permitted)
npm run lint

# Format code or verify formatting with Prettier
npm run format
npm run format:check

# Build production bundle to dist/
npm run build

# Preview production build locally
npm run preview
```

---

## 4. Application Features

### API Architecture & Preserved Day 3 Modules

All networking, wire-format validation, and domain transformations are handled by the eight preserved Day 3 modules (verified via SHA256 checksums):

1. `src/shared/api/client.ts` — Shared `fetchJson` HTTP client, `ApiError` class, and runtime URL query overrides (`?api_base=`).
2. `src/modules/products/products.types.ts` — Domain types (`Product`, `Category`, `CategoryFilter`, `SortOrder`, `LoadState`).
3. `src/modules/products/products.api.ts` — Wire format interfaces (`ApiProduct`, `ApiProductList`), runtime validators (`isApiProduct`, `parseApiProductList`), `price_cents` to dollar conversion (`toProduct`), and `getProducts()` with `?api_mode=` simulation support.
4. `src/modules/products/products.logic.ts` — Pure client-side filtering (`filterProducts`), price sorting (`sortProducts`), and category grouping (`groupProductsByCategory`).
5. `src/modules/cart/cart.types.ts` — Cart domain types (`CartItem`, `Cart`, `AddableProduct`).
6. `src/modules/cart/cart.logic.ts` — Pure monetary and quantity reducers (`calculateTotalItems`, `calculateTotalPrice`, `calculateLineTotal`).
7. `src/modules/cart/cart.state.ts` — In-memory and `localStorage` cart synchronization (`initializeCartState`, `addToCart`, `increaseQuantity`, `decreaseQuantity`, `removeFromCart`, `clearCart`).
8. `src/modules/artworks/artworks.types.ts` — Preserved artwork gallery domain types.

### Asynchronous States (`StatusMessage`)

- **Loading (`variant="loading"`)**: Displayed while `getProducts()` is in flight (`role="status"`, `aria-live="polite"`).
- **Error (`variant="error"`)**: Displayed if the API request fails or returns malformed data (`role="alert"`, `aria-live="assertive"`), accompanied by a **Try Again** button wired to `handleRetry`.
- **Empty Catalog (`variant="empty-catalog"`)**: Displayed when the API returns `0` products.
- **Empty Filter (`variant="empty-filter"`)**: Displayed alongside `ProductToolbar` when active search or category filters match `0` products, allowing the user to adjust or clear filters without losing toolbar access.

### Search, Category Filtering & Price Sorting (`ProductToolbar`)

- **Search**: Case-insensitive substring matching on product names with an instant clear (`×`) button.
- **Category Pills**: Dynamically derived in order of first appearance via `groupProductsByCategory(products)` plus an `All` pill (`aria-pressed` state).
- **Price Sorting**: Supports `default` (original order), `asc` (Price: Low to High), and `desc` (Price: High to Low) via `sortProducts()`.

### Cart Operations, Accessibility & Persistence (`CartPanel` & `CartRow`)

- **Native Modal Dialog**: Built on HTML `<dialog>` opened via `.showModal()`, providing top-layer background inertness, keyboard focus trapping (`Tab` and `Shift+Tab`), `Escape` key dismissal (`onCancel`), outside backdrop click dismissal (bounding-box coordinate check), and automatic focus restoration to the Header cart button.
- **Mutations & Auto-Removal**: Supports adding in-stock items, incrementing (`+`), decrementing (`−` with automatic row removal when quantity reaches `0`), removing individual rows, and clearing the entire cart. Out-of-stock products render a disabled **Sold Out** button and are guarded at both UI and state layers.
- **Persistence**: Every cart mutation synchronizes with `localStorage` under `shopboard_cart` and restores safely on reload via `initializeCartState()`.

---

## 5. Component Tree & Architecture

Only the components actually implemented in `src/` are part of the hierarchy:

```text
App (src/App.tsx)
├── Header (src/components/Header.tsx)
├── main.shopboard-content
│   ├── StatusMessage [variant="loading" | "error" | "empty-catalog"] (src/components/StatusMessage.tsx)
│   └── [when loadState.status === 'success' && products.length > 0]
│       ├── ProductToolbar (src/components/ProductToolbar.tsx)
│       ├── StatusMessage [variant="empty-filter"] (when filteredAndSortedProducts.length === 0)
│       └── ProductList (src/components/ProductList.tsx)
│           └── ProductCard[] (src/components/ProductCard.tsx)
└── CartPanel (src/components/CartPanel.tsx)
    └── CartRow[] (src/components/CartRow.tsx)
```

---

## 6. Exact Component Props Contracts

### `HeaderProps` (`src/components/Header.tsx`)

```ts
export interface HeaderProps {
  readonly title: string
  readonly totalItems: number
  readonly isCartOpen?: boolean
  readonly onToggleCart?: () => void
}
```

### `StatusMessageProps` (`src/components/StatusMessage.tsx`)

```ts
export type StatusVariant =
  'loading' | 'error' | 'empty-catalog' | 'empty-filter'

export interface StatusMessageProps {
  readonly variant: StatusVariant
  readonly message?: string
  readonly onRetry?: () => void
}
```

### `ProductToolbarProps` (`src/components/ProductToolbar.tsx`)

```ts
export interface ProductToolbarProps {
  readonly searchTerm: string
  readonly onSearchChange: (searchTerm: string) => void
  readonly selectedCategory: CategoryFilter
  readonly onCategoryChange: (category: CategoryFilter) => void
  readonly sortOrder: SortOrder
  readonly onSortChange: (sortOrder: SortOrder) => void
  readonly availableCategories: readonly Category[]
  readonly resultCount: number
}
```

### `ProductListProps` (`src/components/ProductList.tsx`)

```ts
export interface ProductListProps {
  readonly products: readonly Product[]
  readonly onAddToCart: (product: AddableProduct) => void
}
```

### `ProductCardProps` (`src/components/ProductCard.tsx`)

```ts
export interface ProductCardProps {
  readonly product: Product
  readonly onAddToCart: (product: AddableProduct) => void
}
```

### `CartPanelProps` (`src/components/CartPanel.tsx`)

```ts
export interface CartPanelProps {
  readonly isOpen: boolean
  readonly items: readonly CartItem[]
  readonly totalItems: number
  readonly totalPrice: number
  readonly onClose: () => void
  readonly onClearCart: () => void
  readonly onIncreaseItem: (productId: string) => void
  readonly onDecreaseItem: (productId: string) => void
  readonly onRemoveItem: (productId: string) => void
}
```

### `CartRowProps` (`src/components/CartRow.tsx`)

```ts
export interface CartRowProps {
  readonly item: CartItem
  readonly onIncrease: (productId: string) => void
  readonly onDecrease: (productId: string) => void
  readonly onRemove: (productId: string) => void
}
```

---

## 7. State Ownership & Callback Data Flow

| State / Derived Value                         | Owner           | Mechanism                                          | Downstream Consumers                                                      |
| :-------------------------------------------- | :-------------- | :------------------------------------------------- | :------------------------------------------------------------------------ |
| `loadState` (`LoadState`)                     | `App`           | `useState` + `useEffect(getProducts)`              | Conditional rendering of `StatusMessage`, `ProductToolbar`, `ProductList` |
| `retryCounter` (`number`)                     | `App`           | `useState` incremented in `handleRetry`            | Re-triggers catalog fetch effect on error retry                           |
| `cart` (`Cart`)                               | `App`           | `useState(() => initializeCartState())`            | Passed as `items` to `CartPanel`; drives memoized totals                  |
| `isCartOpen` (`boolean`)                      | `App`           | `useState(false)`                                  | Passed to `Header` (`isCartOpen`) and `CartPanel` (`isOpen`)              |
| `searchTerm` (`string`)                       | `App`           | `useState('')`                                     | Controlled input in `ProductToolbar` (`onSearchChange`)                   |
| `selectedCategory` (`CategoryFilter`)         | `App`           | `useState<CategoryFilter>('all')`                  | Category pills in `ProductToolbar` (`onCategoryChange`)                   |
| `sortOrder` (`SortOrder`)                     | `App`           | `useState<SortOrder>('default')`                   | Sort `<select>` in `ProductToolbar` (`onSortChange`)                      |
| `totalCartItems` (`number`)                   | `App` (Derived) | `useMemo(() => calculateTotalItems(cart), [cart])` | `Header` badge (`totalItems`) and `CartPanel` header/subtotal             |
| `totalCartPrice` (`number`)                   | `App` (Derived) | `useMemo(() => calculateTotalPrice(cart), [cart])` | `CartPanel` footer subtotal (`totalPrice`)                                |
| `availableCategories` (`readonly Category[]`) | `App` (Derived) | `useMemo(() => groupProductsByCategory(...))`      | `ProductToolbar` category pills                                           |
| `filteredAndSortedProducts` (`Product[]`)     | `App` (Derived) | `useMemo(() => sortProducts(filterProducts(...)))` | `ProductList` items and `ProductToolbar` result count                     |

---

## 8. Testing & Verification

### Quality Gate Suite

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```

### API Simulation & Local Fixture Testing

The preserved `client.ts` and `products.api.ts` modules support built-in query parameters for deterministic browser verification:

- `?api_base=http://127.0.0.1:<port>` — Directs `fetchJson` to a local fixture server returning the 12-product ShopBoard catalog payload (`{ items: ApiProduct[], total: number }`).
- `?api_mode=fail` / `?api_mode=empty` / `?api_mode=delay` — Exercises HTTP 500 error recovery, empty catalog state, and loading state transitions.

### Known External API Connectivity Limitation

In the current host environment, direct outbound HTTPS requests to `https://shopboard-api.vercel.app/api/products` and `https://shopboard-api.vercel.app/debug-lab` are intermittently or consistently reset at the network/TLS layer (`net::ERR_CONNECTION_RESET` / `curl: (28) Connection timed out`).

- The default `BASE_URL = "https://shopboard-api.vercel.app"` in `src/shared/api/client.ts` remains **unchanged**.
- All functional UI, filtering (`filterProducts`), sorting (`sortProducts`), category derivation (`groupProductsByCategory`), accessibility, and cart persistence (`initializeCartState`, `addToCart`, `increaseQuantity`, `decreaseQuantity`, `removeFromCart`, `clearCart`, `calculateTotalItems`, `calculateTotalPrice`, `calculateLineTotal`) verifications were executed in headless Microsoft Edge against a local HTTP fixture server via the preserved `?api_base=` query parameter override.
- Similarly, for the Debug Lab (`https://shopboard-api.vercel.app/debug-lab`), direct live-hosted interactive testing was blocked by `net::ERR_CONNECTION_RESET`; the five Debug Lab bugs documented in [`debug-lab-log.md`](./debug-lab-log.md) were reproduced locally in headless Edge using the unminified Vite development assets (`/debug-lab/assets/index-CbYUo1e8.js` and `/debug-lab/assets/index-_uY36eBd.css`) recovered from the Edge disk cache after an automatic browser retry.
