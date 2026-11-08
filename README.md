# ShopBoard React Storefront — CorePro Day 5

A production-grade, strictly typed React 19 storefront application featuring multi-page client-side routing, shared shopping cart context, signal-aware abortable API fetching, route-level Error Boundaries, lazy chunk Suspense transitions, and a validated demo checkout built with React Hook Form, Zod, and official shadcn/ui Field primitives.

---

## 1. Project Overview & Architecture

**ShopBoard React** represents the completed Phase 1 through Phase 5 migration of the ShopBoard storefront from a vanilla TypeScript prototype to an idiomatic, modular React architecture:

- **Build System & Toolchain**: Vite with React 19, TypeScript (strict mode, zero explicit `any`), Oxlint (`oxlint --deny-warnings`), Prettier, and Husky pre-commit hooks (`lint-staged`).
- **Routing & Code-Splitting**: React Router v7 with dynamic `React.lazy` chunk imports, shared layout shell, accessible `<RouteLoadingSpinner />` Suspense fallbacks, and resilient route-level Error Boundaries.
- **Cart State Management**: Single shared `CartProvider` context owning client-side cart mutations, localStorage synchronization (`{ id, qty }`), and automatic live product data rehydration.
- **API Boundary & Transport**: Secure, signal-aware transport (`src/shared/api/transport.ts`) enforcing trusted API origins, query-parameter override immunity (`?api_base=`), raw wire-format category validation, and automatic `AbortController` request cancellation upon unmount or param change.
- **Validated Checkout**: Accessible checkout form utilizing React Hook Form's `<Controller>`, Zod schema validation, universal international postal code support, and modern official shadcn/ui `Field` primitives.
- **Historical Parity**: Byte-for-byte SHA256 preservation of the eight protected Day 3 domain modules.

---

## 2. Setup & Execution Commands

```bash
# 1. Install dependencies deterministically
npm ci

# 2. Run local development server (React StrictMode active)
npm run dev

# 3. Execute all unit and integration tests (Node native test runner)
npm test

# 4. Verify TypeScript type safety (zero errors)
npm run typecheck

# 5. Run linter (zero warnings or errors allowed)
npm run lint

# 6. Verify and format code style with Prettier
npm run format:check
npm run format

# 7. Create optimized production build
npm run build

# 8. Preview production build locally
npm run preview
```

---

## 3. Route Configuration & Page Contracts

The storefront provides **five distinct functional pages plus a dedicated 404 page**, all wrapped within a persistent application shell:

| Route Path      | Page Component       | Purpose & Features                                                                                                                                                                     |
| :-------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | `HomePage`           | Hero landing view with curated categories, studio highlights, and direct call-to-action links to the catalog.                                                                          |
| `/products`     | `CatalogPage`        | Full storefront catalog hosting the 12-item product grid, dynamic category filter tabs, live substring search, and price sorting (`asc`, `desc`, `default`).                           |
| `/products/:id` | `ProductDetailsPage` | Dedicated product view by ID, detailed descriptions, live inventory stock badges, quantity adjustment controls, "Add to Cart" action, and 404 error states for invalid or missing IDs. |
| `/cart`         | `CartPage`           | Dedicated shopping cart review page with itemized product summaries, quantity increment/decrement controls, item deletion, full cart clear, and direct checkout navigation.            |
| `/checkout`     | `CheckoutPage`       | Validated demonstration checkout form with input validation, international postal code support, empty-cart guard, and demo confirmation receipt.                                       |
| `*`             | `NotFoundPage`       | Catch-all 404 error page for unmatched URLs with accessible error illustration and return link to the catalog.                                                                         |

---

## 4. Component Tree & Hierarchy

```text
App (src/App.tsx)
└── BrowserRouter
    └── CartProvider (src/features/cart/CartProvider.tsx)
        └── Routes
            └── Route (element={<RootLayout />})
                ├── Header (src/shared/components/Header.tsx)
                │   ├── Brand Link
                │   ├── NavLinks (Home, Catalog, Cart)
                │   └── Cart Toggle Button (aria-expanded, live item count badge)
                │
                ├── main.shopboard-content
                │   └── ErrorBoundary (key={location.pathname}) (src/shared/components/ErrorBoundary.tsx)
                │       └── Suspense (fallback={<RouteLoadingSpinner />})
                │           └── Outlet
                │               ├── HomePage (src/pages/HomePage.tsx)
                │               │   └── Hero (src/features/products/components/Hero.tsx)
                │               │
                │               ├── CatalogPage (src/pages/CatalogPage.tsx)
                │               │   └── Storefront (src/features/products/components/Storefront.tsx)
                │               │       ├── Hero
                │               │       ├── StatusMessage [loading | error | empty-catalog | empty-filter]
                │               │       ├── ProductToolbar (Search, Category Tabs, Price Sort)
                │               │       └── ProductList
                │               │           └── ProductCard[]
                │               │
                │               ├── ProductDetailsPage (src/pages/ProductDetailsPage.tsx)
                │               │   ├── Breadcrumb Navigation
                │               │   ├── StatusMessage [loading | error]
                │               │   ├── Product Not Found Card (for 404 / invalid IDs)
                │               │   └── Product Details Card (Title, Price, Stock, Quantity Stepper, Add CTA)
                │               │
                │               ├── CartPage (src/pages/CartPage.tsx)
                │               │   ├── Empty Cart Notice
                │               │   └── Cart Table Breakdown (CartRow[], Subtotal, Checkout CTA)
                │               │
                │               ├── CheckoutPage (src/pages/CheckoutPage.tsx)
                │               │   ├── Empty Cart Guard
                │               │   ├── Validated Form (<Controller> + <Field>)
                │               │   │   ├── Field [fullName] (Input, FieldLabel, FieldError)
                │               │   │   ├── Field [email] (Input, FieldLabel, FieldError)
                │               │   │   ├── Field [address] (Input, FieldLabel, FieldError)
                │               │   │   ├── Field [city] (Input, FieldLabel, FieldError)
                │               │   │   └── Field [postalCode] (Input, FieldLabel, FieldError)
                │               │   ├── Order Summary Sidebar
                │               │   └── Demo Order Confirmed View (Snapshot details, demo disclaimer)
                │               │
                │               └── NotFoundPage (src/pages/NotFoundPage.tsx)
                │
                └── CartPanel (src/features/cart/components/CartPanel.tsx)
                    └── CartRow[] (src/features/cart/components/CartRow.tsx)
```

---

## 5. Architectural Deep Dives

### 5.1 React.lazy & Suspense vs. Explicit Data Fetching

- **Code-Splitting via Suspense**: Page routes are code-split using `React.lazy(() => import('./pages/...'))` and wrapped with a shared `<Suspense fallback={<RouteLoadingSpinner />}>`. During asynchronous route chunk transitions, the spinner renders with `role="status"` and accessible `aria-live="polite"` text.
- **Explicit `LoadState` for Data Fetching**: Product catalog and single-product requests intentionally use React's canonical `useState<LoadState>` + `useEffect` pattern rather than throwing promises into React Suspense. This ensures full compatibility across standard React 19 without requiring third-party query caching engines, providing explicit loading, success, and retry state management.

### 5.2 Resilient Route Error Boundary

- **Component Isolation**: [`src/shared/components/ErrorBoundary.tsx`](src/shared/components/ErrorBoundary.tsx) wraps the `<Outlet />` inside the layout's `<main>` landmark. If a lazy chunk fails to load or an unhandled rendering error occurs, only the route content is replaced by the error card. The top `<Header />` and `<CartPanel />` remain fully mounted and functional.
- **Recovery Actions**: The error card provides an accessible **"Try Again"** button wired to `handleReset`, which resets the error state in-place.
- **No-Trap Route Keying**: `<ErrorBoundary key={location.pathname}>` binds the boundary instance to the active URL path. Navigating to another route immediately unmounts the errored view and mounts a fresh route instance, ensuring the user is never trapped on an error screen.

### 5.3 Shared Cart State & Storage Engine

- **Single Source of Truth**: `CartProvider` (`src/features/cart/CartProvider.tsx`) owns cart state across all five pages and the modal drawer.
- **Compact Persistence**: Only minimal product identifiers and quantities (`{ id: string, qty: number }`) are written to `localStorage` under `shopboard_cart`.
- **Live Rehydration**: In accordance with modern e-commerce requirements, product prices, stock availability, and titles are never trusted from stale storage. They are dynamically rehydrated against the live catalog data on load.
- **Immutability & Pure Reducers**: All cart mutations (`addItem`, `increaseItem`, `decreaseItem`, `removeItem`, `clearCart`) are pure, non-mutating reducers in `src/features/cart/cart.logic.ts`.

### 5.4 Secure API Transport & Request Cancellation

- **Trusted Origin Validation**: Active HTTP transport (`src/shared/api/transport.ts`) routes requests exclusively to the verified origin defined by `VITE_API_BASE_URL` (or falls back to the canonical production URL `https://shopboard-api.vercel.app`).
- **Query Parameter Immunity**: URL query parameters such as `?api_base=https://attacker.invalid` are strictly blocked from redirecting requests.
- **AbortController Cancellation**: Catalog and product-by-ID fetch calls take an `AbortSignal`. When the user navigates away or updates search criteria before a response arrives, the cleanup function invokes `controller.abort()`, preventing race conditions and stale state updates.

### 5.5 Validated Checkout Form (shadcn/ui Field + React Hook Form)

- **Modern shadcn Primitives**: Migrated from legacy `FormField` wrappers to the current official shadcn/ui `Field` family ([https://ui.shadcn.com/docs/components/field](https://ui.shadcn.com/docs/components/field)) using `Field`, `FieldLabel`, and `FieldError` with standard `data-slot` attributes.
- **Controller Integration**: Inputs are bound using React Hook Form's standard `<Controller>` pattern.
- **International Postal Codes**: Validates universal international postal and ZIP codes (`/^[A-Za-z0-9\s-]+$/`, length 3–10) with the standardized message `"Please enter a valid postal or ZIP code"`, supporting UK, US, Canada, Turkey, and international formats.
- **Strict Demo-Only Semantics**: The checkout explicitly identifies itself as a demonstration workflow. No banking transactions or fake order IDs are generated. Upon valid submission, an immutable `DemoOrderSnapshot` is captured and the cart is cleared.

---

## 6. Testing & Quality Verification

### 6.1 Test Suites (`npm test`)

The test runner executes 159 unit and integration tests across 53 test suites without external test dependencies (`node --test`):

1. **`cart.integration.test.ts`** (7 tests): Storage reads, dynamic price hydration, StrictMode purity, lifecycle.
2. **`cart.logic.test.ts`** (17 tests): Pure item addition, quantity steppers, auto-removal, total calculations.
3. **`cart.storage.test.ts`** (22 tests): Schema validation, version migrations, corrupted JSON recovery, storage errors.
4. **`checkout.test.ts`** (19 tests): Schema validation, international postal codes, empty cart guard, demo snapshot.
5. **`product.abortable.test.ts`** (9 tests): AbortSignal mechanics, cancellation, timing.
6. **`product.adapter.test.ts`** (18 tests): Raw API payload validation, category mapping, cents-to-dollars.
7. **`product.boundary.test.ts`** (13 tests): Defensive error boundaries, invalid category rejection.
8. **`product.lifecycle.test.ts`** (15 tests): Mount, unmount, retry transitions, StrictMode resilience.
9. **`routing.test.ts`** (7 tests): Route contracts, product-by-ID fetching, 404 handling, cross-page cart state.
10. **`origin.security.test.ts`** (26 tests): Origin validation, query override immunity, attacker URL blocking.
11. **`error-boundary.test.ts`** (6 tests): Initial state, derived error computation, message extraction, recovery reset.

**Total**: 159 tests passing, 0 failing across 53 test suites.

### 6.2 Pre-Commit Hooks

Configured via Husky and `lint-staged`:

- `*.{ts,tsx}`: `oxlint --deny-warnings` (including `"typescript/no-explicit-any": "error"`) and `prettier --write`
- `*.{json,css,html,md}`: `prettier --write`

---

## 7. Known Architectural Decisions & Limitations

1. **Data Fetching vs. React Suspense**: As documented in Section 5.1, data fetching utilizes explicit `useState<LoadState>` rather than Suspense resource throwing. This design maintains strict adherence to standard React 19 primitives without requiring experimental caching APIs.
2. **Demonstration Checkout**: The checkout process captures local client-side state and confirms the order with a demo notice; it does not connect to a real payment processor or backend fulfillment service.
3. **Preserved Day 3 Domain Modules**: The eight historical modules under `src/modules/` and `src/shared/api/client.ts` are preserved byte-for-byte to maintain verifiable SHA256 parity with the Day 3/Day 4 baselines.
